import fs from 'fs';
import N3 from 'n3';
import jsonld from 'jsonld';
import rdf from '@zazuko/env-node';
import { QueryEngine } from '@comunica/query-sparql-rdfjs';
import { RdfStore } from 'rdf-stores';
import { output } from '@milieuinfo/maven-metadata-generator-npm';
import { sortLines } from '@milieuinfo/maven-metadata-generator-npm/src/utils/functions.js';
import eyeling from 'eyeling';
import { inchikeys_from_csv, clean_inchikey } from './inchikeys.js';
import {
    config,
    context_extra,
    chemontSource,
    chemontTaxonomyOptions,
    chemontLevelsOptions
} from './variables.js';

const ENTITIES_DIR = './source/chemont/entities/';
const ENTITY_ENDPOINT = 'https://cfb.fiehnlab.ucdavis.edu/entities/';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function writeJson(json, filepath) {
    fs.mkdirSync(filepath.substring(0, filepath.lastIndexOf('/')), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(json, null, 4));
}

function cleanEntity(entity) {
    const object = {};
    Object.keys(entity).forEach(key => { object[key] = clean_inchikey(key, entity[key]); });
    return object;
}

/**
 * Classyfire-classificatie (ouders in ChemOnt) per InChIKey. Gebruikt de cache in
 * source/chemont/entities/ en haalt ontbrekende stoffen op bij de classyfire entity-service.
 */
async function resolve_parent_from_inchikey(inchikeys) {
    const entities = [];
    let fetched = 0, failed = 0;
    for (const inchikey of inchikeys) {
        const jsonFile = ENTITIES_DIR + inchikey + '.json';
        if (fs.existsSync(jsonFile)) {
            entities.push(cleanEntity(JSON.parse(fs.readFileSync(jsonFile, 'utf8'))));
            continue;
        }
        await delay(5000); // de service niet overbelasten
        try {
            const res = await fetch(new URL(inchikey, ENTITY_ENDPOINT));
            const body = await res.json().catch(() => ({ status: res.status }));
            if (res.ok) {
                writeJson(body, jsonFile);
                entities.push(cleanEntity(body));
                fetched++;
            } else {
                writeJson(body, ENTITIES_DIR + 'error/' + inchikey + '.json');
                failed++;
            }
        } catch (err) {
            writeJson({ inchikey, error: err.message }, ENTITIES_DIR + 'error/' + inchikey + '.json');
            failed++;
        }
    }
    console.log(`chemont: ${entities.length} stoffen geclassificeerd (${fetched} nieuw opgehaald, ${failed} niet gevonden)`);
    return { "@graph": entities, "@context": context_extra };
}

async function constructNt(query, store) {
    const quads = await (await new QueryEngine().queryQuads(query, { sources: [store] })).toArray();
    return new N3.Writer({ format: 'N-Triples' }).quadsToString(quads);
}

function storeFromNt(nt) {
    const store = RdfStore.createDefault();
    new N3.Parser({ format: 'N-Triples' }).parse(nt).forEach(quad => store.addQuad(quad));
    return store;
}

/**
 * Notation3-redenering (regels uit config.skos.rules) op N-Triples, met eyeling: dezelfde redeneerder en
 * aanroep als n3_reasoning uit de library. Die verwacht echter JSON-LD, en de omzetting N-Triples ->
 * JSON-LD -> N-Triples van de ~185.000 triples van de taxonomie duurt te lang; daarom roepen we eyeling
 * rechtstreeks aan op de N-Triples. Enkel de regels uit de regelbestanden worden gebruikt.
 */
function reason(nt) {
    const frules = [];
    const brules = [];
    for (const rule of Object.values(config.skos.rules)) {
        const parsed = eyeling.parseN3Text(fs.readFileSync(process.cwd() + rule, 'utf8'));
        frules.push(...parsed.frules);
        brules.push(...parsed.brules);
    }
    const result = eyeling.reasonStream({ n3: nt, frules, brules }, { rdfjs: true });
    return sortLines(new N3.Writer({ format: 'N-Triples' }).quadsToString(result.closureQuads));
}

/**
 * Bouwt de ChemOnt-taxonomie op voor de stoffen in de codelijst:
 * 1. ChemOnt (OWL) naar SKOS (source/chemont/skos_chemont_2_1.ttl)
 * 2. per stof de classyfire-ouders, en enkel de takken van de taxonomie die door stoffen gebruikt worden
 * 3. redenering + validatie -> chemische_stof_chemont_taxonomy.ttl/.jsonld
 * 4. classificatieniveaus (xkos) -> chemische_stof_chemont_classificationlevels.ttl
 */
async function chemont_taxonomy_to_skos() {
    console.log('chemont: taxonomie naar skos');
    const chemont = await rdf.dataset().import(rdf.fromFile(config.source.chemont));
    const chemontStore = RdfStore.createDefault();
    for (const quad of chemont) chemontStore.addQuad(quad);
    const taxonomyNt = await constructNt(fs.readFileSync(config.skos.sparql.chemont_skos, 'utf8'), chemontStore);
    const ttlWriter = new N3.Writer({ format: 'text/turtle', prefixes: chemontSource.prefixes });
    ttlWriter.addQuads(new N3.Parser({ format: 'N-Triples' }).parse(taxonomyNt));
    await new Promise((resolve, reject) => ttlWriter.end((err, result) => {
        if (err) return reject(err);
        fs.writeFileSync(config.source.chemont_skos, result);
        resolve();
    }));

    console.log('chemont: ouders van de stoffen');
    const inchikeys = await inchikeys_from_csv();
    const parentsNt = await jsonld.toRDF(await resolve_parent_from_inchikey(inchikeys), { format: 'application/n-quads' });

    console.log('chemont: enkel gebruikte takken van de taxonomie');
    const mergedStore = storeFromNt(sortLines(taxonomyNt + '\n' + parentsNt));
    const broaderNt = await constructNt(fs.readFileSync(config.skos.sparql.broader_skos, 'utf8'), mergedStore);

    console.log('chemont: redenering');
    const taxonomy = reason(sortLines(broaderNt + '\n' + parentsNt));
    await output(chemontSource, taxonomy, chemontTaxonomyOptions);

    console.log('chemont: classificatieniveaus (xkos)');
    const levelsNt = await constructNt(fs.readFileSync(config.skos.sparql.chemont_xkos, 'utf8'), storeFromNt(taxonomy));
    await output(chemontSource, sortLines(levelsNt), chemontLevelsOptions);
}

export { chemont_taxonomy_to_skos }
