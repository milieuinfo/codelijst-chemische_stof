import jp from 'jsonpath';
import jsonld from 'jsonld' ;
import {readFileSync} from 'fs';
import fs from 'fs-extra';
import { QueryEngine } from "@comunica/query-sparql";
import rdfDataset from "@rdfjs/dataset";
import {jsonld_writer, n3_reasoning, output} from 'maven-metadata-generator-npm';
import {
    config,
    frame_chebi,
    context_extra,
    shapes_skos,
    shapes_skos_chebi
} from './variables.js';
import { inchikeys_from_csv } from './inchikeys.js'


async function write_json(json, filepath) {
    try {
        await fs.writeFile(filepath, JSON.stringify(json, null, 4))
        console.log('success!')
    } catch (err) {
        console.error(err)
    }
}

async function get_chebi_from_inchikey(inchikeys){
    var new_json = new Array();
    const endpoint = "https://sparql.rhea-db.org/sparql";
    for (const inchikey of inchikeys) {
        const json_file = './source/chebi/entities/' + inchikey + '.json'
        if (fs.existsSync(json_file)) {
            new_json.push( jp.query(await jsonld.flatten(JSON.parse(readFileSync(json_file)), frame_chebi), '$.graph[*]'));
        }
        else {
            try {
                const myEngine = new QueryEngine();
                var query = fs.readFileSync(config.skos.sparql.chebi_skos, 'utf8').replace(/INCHIKEY/g, inchikey)

                const dataset = rdfDataset.dataset()
                const quadStream = await myEngine.queryQuads(query, { sources: ['https://sparql.rhea-db.org/sparql'] });
                quadStream.on('data', (quad) => {
                    dataset.add(quad);
                });
                quadStream.on('end', () => {
                    jsonld_writer(dataset, [json_file, frame_chebi]);
                });
            }
            catch(err) {
                write_json({"inchikey": inchikey, "error": err}, './source/chebi/entities/error/' + inchikey + '.json');
                console.error(err);
            }
        }
    }
    return {"@graph": new_json, "@context": context_extra}
}


async function chebi_information(chebi_ttl, chebi_jsonld) {
    const inchikeys = await inchikeys_from_csv()
    const my_jsonld = await get_chebi_from_inchikey(inchikeys)
    //fs.writeFileSync('/home/gehau/git/codelijst-chemische_stof/src/main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chebi_taxonomy-test.jsonld'
    //     , JSON.stringify(await jsonld.frame(my_jsonld, frame_chebi), null, 4));
    // //write_json(jsonld, './source/chemont/entities/error/' + inchikey + '.json');
    const nt = await n3_reasoning(my_jsonld, config.skos.rules)
    output(shapes_skos_chebi, nt, chebi_ttl, chebi_jsonld)
    console.log("parent information");
}

export { chebi_information }


