import fs from 'fs';
import jsonld from 'jsonld';
import rdf from '@zazuko/env-node';
import { QueryEngine } from '@comunica/query-sparql';
import { output } from '@milieuinfo/maven-metadata-generator-npm';
import { n3_reasoning } from '@milieuinfo/maven-metadata-generator-npm/src/utils/functions.js';
import { jsonld_writer } from '@milieuinfo/maven-metadata-generator-npm/src/utils/writers.js';
import { inchikeys_from_csv } from './inchikeys.js';
import {
    config,
    frame_chebi,
    context_extra,
    chebiSource,
    chebiOptions
} from './variables.js';

const ENTITIES_DIR = './source/chebi/entities/';
const ENDPOINT = 'https://sparql.rhea-db.org/sparql';

function writeJson(json, filepath) {
    fs.mkdirSync(filepath.substring(0, filepath.lastIndexOf('/')), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(json, null, 4));
}

/**
 * ChEBI-gegevens (formule, InChI, InChIKey, SMILES, synoniemen, ...) per InChIKey. Gebruikt de cache in
 * source/chebi/entities/ en bevraagt voor ontbrekende stoffen het Rhea SPARQL-endpoint.
 */
async function get_chebi_from_inchikey(inchikeys) {
    const nodes = [];
    const engine = new QueryEngine();
    const queryTemplate = fs.readFileSync(config.skos.sparql.chebi_skos, 'utf8');
    let fetched = 0, failed = 0;
    for (const inchikey of inchikeys) {
        const jsonFile = ENTITIES_DIR + inchikey + '.json';
        if (!fs.existsSync(jsonFile)) {
            try {
                const quads = await (await engine.queryQuads(queryTemplate.replace(/INCHIKEY/g, inchikey), { sources: [ENDPOINT] })).toArray();
                await jsonld_writer(rdf.dataset(quads), { file: jsonFile, frame: frame_chebi });
                fetched++;
            } catch (err) {
                writeJson({ inchikey, error: err.message }, ENTITIES_DIR + 'error/' + inchikey + '.json');
                console.error(`chebi: ${inchikey}: ${err.message}`);
                failed++;
                continue;
            }
        }
        const flattened = await jsonld.flatten(JSON.parse(fs.readFileSync(jsonFile, 'utf8')), frame_chebi);
        nodes.push(...(flattened.graph ?? []));
    }
    console.log(`chebi: ${inchikeys.length} stoffen (${fetched} nieuw opgevraagd, ${failed} fouten)`);
    return { "@graph": nodes, "@context": context_extra };
}

/** ChEBI-verrijking van de stoffen in de codelijst -> chemische_stof_chebi.ttl/.jsonld */
async function chebi_information() {
    console.log('chebi: verrijking');
    const inchikeys = await inchikeys_from_csv();
    const chebi = await get_chebi_from_inchikey(inchikeys);
    const nt = await n3_reasoning(chebi, config.skos.rules);
    await output(chebiSource, nt, chebiOptions);
}

export { chebi_information }
