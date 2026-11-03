'use strict';
/**
 * Brengt alle Turtle-bestanden van de codelijst samen (codelijst, ChemOnt-taxonomie en -classificatieniveaus,
 * ChEBI-verrijking, annotaties, collecties), past de N3-regels uit config.skos.rules toe en valideert het
 * resultaat tegen de SHACL-shapes.
 *
 * Gebruik (vanuit src/):
 *   node 03_validate_skos.js                      # shapes: chemische_stof_samengevoegd-ap-constraints.ttl
 *   node 03_validate_skos.js --shapes a.ttl --shapes b.ttl
 *   node 03_validate_skos.js --no-reasoning       # enkel samenvoegen en valideren
 *   node 03_validate_skos.js --dump graaf.nt      # samengevoegde (afgeleide) graaf ook wegschrijven
 *
 * Exit code 1 als de data niet conform is of een stap mislukt.
 * Validatierapport: ../validation/validation_skos.json en .parquet
 */
import fs from 'fs';
import path from 'path';
import N3 from 'n3';
import eyeling from 'eyeling';
import rdf from '@zazuko/env-node';
import validate from '@milieuinfo/maven-metadata-generator-npm/src/utils/shacl_validation.js';
import { config } from './utils/variables.js';

const DATA_DIR = config.skos.path + config.skos.name + '/';
// Applicatieprofiel voor de samengevoegde graaf (de AP's per bronbestand zijn niet samen bruikbaar).
const DEFAULT_SHAPES = config.ap.samengevoegd;
const LOG_FILES = {
    jsonFile: '../validation/validation_skos.json',
    parquetFile: '../validation/validation_skos.parquet'
};

function parseArgs(argv) {
    const args = { shapes: [], reasoning: true };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--shapes') args.shapes.push(argv[++i]);
        else if (argv[i] === '--no-reasoning') args.reasoning = false;
        else if (argv[i] === '--dump') args.dump = argv[++i];
        else throw new Error(`Onbekend argument: ${argv[i]}`);
    }
    if (args.shapes.length === 0) args.shapes.push(DEFAULT_SHAPES);
    return args;
}

/** Alle .ttl-bestanden in de map (geen backups of andere extensies). */
function turtleFiles(dir) {
    return fs.readdirSync(dir)
        .filter(f => f.endsWith('.ttl'))
        .sort()
        .map(f => path.join(dir, f));
}

/** Leest alle bestanden in één N-Triples-string (dubbele triples worden ontdubbeld). */
function mergeToNt(files) {
    const lines = new Set();
    const writer = new N3.Writer({ format: 'N-Triples' });
    for (const file of files) {
        const quads = new N3.Parser({ format: 'text/turtle', baseIRI: config.skos.prefixes.concept })
            .parse(fs.readFileSync(file, 'utf8'));
        console.log(`  ${path.basename(file)}: ${quads.length} triples`);
        for (const quad of quads) {
            // alles in de default graph: de regels en shapes werken op één graaf
            lines.add(writer.quadToString(quad.subject, quad.predicate, quad.object));
        }
    }
    return [...lines].join('');
}

const local = term => term ? term.value.replace(/^.*[#/]/, '') : '-';
const FUSE = 'urn:fuse:';

/** Leesbare weergave van de premisse van een eyeling-regel (voor de rapportering). */
const termText = t => t.constructor.name === 'Var' ? '?' + t.name
    : t.value !== undefined ? (t.constructor.name === 'Iri' ? local(t) : JSON.stringify(t.value)) : String(t);
const premiseText = rule => '{ ' + rule.premise.map(t => `${termText(t.s)} ${termText(t.p)} ${termText(t.o)}`).join(' . ') + ' } => false';

/**
 * N3-redenering met eyeling op N-Triples, zoals in utils/chemont_to_skos.js: enkel de regels uit de
 * regelbestanden worden gebruikt, niet de feiten die erin staan.
 *
 * Integriteitsregels '{ ... } => false' (fuse) zouden eyeling bij de eerste overtreding doen stoppen. Ze
 * worden daarom omgezet naar een regel die een markeertriple <urn:fuse:i> <urn:fuse:focus> ?x afleidt,
 * met ?x de eerste variabele van de premisse. Zo worden alle overtredingen verzameld en kan de
 * SHACL-validatie op de volledige afgeleide graaf toch nog lopen.
 *
 * @returns {{quads: Array, violations: Array<{rule: string, focus: string}>}}
 */
function reason(nt) {
    const frules = [];
    const brules = [];
    const fuses = [];
    for (const rule of Object.values(config.skos.rules)) {
        const parsed = eyeling.parseN3Text(fs.readFileSync(process.cwd() + rule, 'utf8'));
        brules.push(...parsed.brules);
        for (const frule of parsed.frules) {
            const focus = frule.isFuse && frule.premise.flatMap(t => [t.s, t.o]).find(t => t.constructor.name === 'Var');
            if (!focus) { frules.push(frule); continue; }
            const { constructor: Triple, p: { constructor: Iri } } = frule.premise[0];
            frules.push({ ...frule, isFuse: false,
                conclusion: [new Triple(new Iri(FUSE + fuses.length), new Iri(FUSE + 'focus'), focus)] });
            fuses.push(frule);
        }
    }
    const quads = [];
    const violations = [];
    for (const q of eyeling.reasonStream({ n3: nt, frules, brules }, { rdfjs: true }).closureQuads) {
        if (q.subject.value.startsWith(FUSE)) {
            violations.push({ rule: premiseText(fuses[Number(q.subject.value.slice(FUSE.length))]), focus: q.object.value });
        } else {
            quads.push(q);
        }
    }
    return { quads, violations };
}

/** Samenvatting van de regelschendingen, gegroepeerd per regel. */
function summarizeRules(violations) {
    const groups = Map.groupBy(violations, v => v.rule);
    console.log(`\n${violations.length} regelschendingen in ${groups.size} regels:`);
    for (const [rule, vs] of groups) {
        console.log(`\n  [${vs.length}] ${rule}`);
        vs.slice(0, 3).forEach(v => console.log(`      bv. ${v.focus}`));
    }
}

async function loadShapes(files) {
    const shapes = rdf.dataset();
    for (const file of files) {
        await shapes.import(rdf.fromFile(file));
        console.log(`  ${file}`);
    }
    return shapes;
}

/** Samenvatting van de resultaten, gegroepeerd per shape / constraint / pad. */
function summarize(report) {
    const groups = new Map();
    for (const r of report.results) {
        const key = [local(r.severity), local(r.sourceShape), local(r.sourceConstraintComponent), local(r.path)].join(' | ');
        if (!groups.has(key)) groups.set(key, { count: 0, examples: [], message: r.message?.[0]?.value });
        const g = groups.get(key);
        g.count++;
        if (g.examples.length < 3) g.examples.push(r.focusNode?.value + (r.value ? ` -> ${r.value.value}` : ''));
    }
    console.log(`\n${report.results.length} resultaten in ${groups.size} groepen (severity | shape | constraint | pad):`);
    for (const [key, g] of [...groups].sort((a, b) => b[1].count - a[1].count)) {
        console.log(`\n  [${g.count}] ${key}`);
        if (g.message) console.log(`      ${g.message}`);
        g.examples.forEach(e => console.log(`      bv. ${e}`));
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

    console.log(`samenvoegen: ${DATA_DIR}`);
    const files = turtleFiles(DATA_DIR);
    if (files.length === 0) throw new Error(`Geen .ttl-bestanden in ${DATA_DIR}`);
    const nt = mergeToNt(files);

    let quads;
    let violations = [];
    if (args.reasoning) {
        console.log('redenering met:', Object.values(config.skos.rules).map(r => path.basename(r)).join(', '));
        ({ quads, violations } = reason(nt));
    } else {
        quads = new N3.Parser({ format: 'N-Triples' }).parse(nt);
    }
    const data = rdf.dataset(quads.map(q => rdf.quad(q.subject, q.predicate, q.object)));
    console.log(`samengevoegde graaf: ${data.size} triples`);
    if (args.dump) {
        fs.writeFileSync(args.dump, new N3.Writer({ format: 'N-Triples' }).quadsToString([...data]));
        console.log(`  weggeschreven naar ${args.dump}`);
    }

    console.log('shapes:');
    const shapes = await loadShapes(args.shapes);

    console.log('validatie...');
    const report = await validate(shapes, data, LOG_FILES);
    if (violations.length > 0) summarizeRules(violations);
    if (!report.conforms) summarize(report);
    if (violations.length > 0 || !report.conforms) {
        console.error(`\nNiet conform: ${violations.length} regelschendingen, ${report.results.length} SHACL-resultaten.`
            + (report.conforms ? '' : ` Volledig SHACL-rapport: ${LOG_FILES.jsonFile}`));
        process.exit(1);
    }
    console.log('Conform.');
}

main().catch(err => {
    console.error(`validatie mislukt: ${err.message}`);
    process.exit(1);
});
