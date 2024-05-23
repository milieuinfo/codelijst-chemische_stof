import fs from 'fs-extra';
import request from 'request';
import { inchikeys_from_csv , clean_inchikey } from './inchikeys.js'
import {n3_reasoning, output} from "maven-metadata-generator-npm";
import {readFileSync} from "fs";
import rdf from "@zazuko/env-node";
import { QueryEngine } from "@comunica/query-sparql";
import { RdfStore } from "rdf-stores";
import N3 from 'n3';
import {RoxiReasoner} from "roxi-js";


import {
    config,
    context_extra,
    shapes_skos,
    chemont_jsonld,
    chemont_ttl,
    chemont_tax_jsonld,
    chemont_tax_ttl
} from './variables.js';


async function write_json(json, filepath) {
    try {
        await fs.writeFile(filepath, JSON.stringify(json, null, 4))
        console.log('success!')
    } catch (err) {
        console.error(err)
    }
}

const sortLines = str => Array.from(new Set(str.split(/\r?\n/))).sort().join('\n'); // To sort the dump of the reasoner for turtle pretty printing. Easier than using the Sink or Store.

async function resolve_parent_from_inchikey(inchikeys) {
    var new_json = new Array();
    let endpoint = "https://cfb.fiehnlab.ucdavis.edu/entities/";
    for (const inchikey of inchikeys) {
        const url = new URL(inchikey, endpoint).href
        let options = {json: true};
        const json_file = './source/chemont/entities/' + inchikey + '.json'
        if (fs.existsSync(json_file)) {
            const my_json = JSON.parse(readFileSync(json_file))
            const object = {};
            Object.keys(my_json).forEach(function(key) {
                object[key] = clean_inchikey(key, my_json[key]);
            })
            new_json.push(object)
        }
        else {
            request(url, options, (error, res, body) => {
                if (error) {
                    console.log(error)
                }
                ;
                if (!error && res.statusCode == 200) {

                    write_json(body, json_file);
                    const object = {};
                    Object.keys(body).forEach(function(key) {
                        object[key] = clean_inchikey(key, body[key]);
                    })
                    new_json.push(object)
                }
                else {
                    write_json(body, './source/chemont/entities/error/' + inchikey + '.json');
                }

            });
        }
    }
    return {"@graph": new_json, "@context": context_extra}
}


async function chemont_taxonomy_to_skos(){
    const chemont = await rdf.dataset().import(rdf.fromFile('/home/gehau/git/codelijst-chemische_stof/src/source/chemont/ChemOnt_2_1.ttl'))
    const store = RdfStore.createDefault();
    chemont._quads.forEach(async (quad) => {
        store.addQuad(quad)
    });
    const myEngine = new QueryEngine();
    var query = fs.readFileSync(config.skos.sparql.chemont_skos, 'utf8')

    const store_2 = RdfStore.createDefault();
    const quadStream = await myEngine.queryQuads(query, { sources: [store] });
    quadStream.on('data', (quad) => {
        store_2.addQuad(quad)
    });
    quadStream.on('end', () => {
       chemont_taxonomy_to_xkos(store_2);
    });
}
async function reasoning(rdf_input, rules) {
    console.log("n3 reasoning ");
    let rdf = await sortLines( rdf_input )
    const reasoner = RoxiReasoner.new();
    reasoner.add_abox(rdf);
    for (let rule in rules) {
        reasoner.add_rules(fs.readFileSync(process.cwd() + rules[rule], 'utf8'));
    }
    reasoner.materialize();
    const nt = await sortLines(reasoner.get_abox_dump());
    output(shapes_skos, nt, chemont_tax_ttl, chemont_tax_jsonld)
}

async function chemont_taxonomy_to_xkos(store){
    const myEngine = new QueryEngine();
    var query = fs.readFileSync(config.skos.sparql.chemont_xkos, 'utf8')
    const nt_writer = new N3.Writer({ format: 'N-Triples' });
    const quadStream = await myEngine.queryQuads(query, { sources: [store] });
    quadStream.on('data', (quad) => {
        nt_writer.addQuad(quad);
    });
    quadStream.on('end', () => {
        nt_writer.end((error, result) => reasoning(result, config.skos.rules));
    });
}

async function parent_information() {
    const inchikeys = await inchikeys_from_csv()
    const jsonld = await resolve_parent_from_inchikey(inchikeys)
    const nt = await n3_reasoning(jsonld, config.skos.rules)
    output(shapes_skos, nt, chemont_ttl, chemont_jsonld)
    console.log("parent information");
}

export { parent_information, chemont_taxonomy_to_skos }


