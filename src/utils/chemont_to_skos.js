import fs from 'fs-extra';
import request from 'request';
import { inchikeys_from_csv , clean_inchikey } from './inchikeys.js'
import {n3_reasoning, output} from "maven-metadata-generator-npm";
import {readFileSync} from "fs";

import {
    config,
    chemont_ttl,
    chemont_jsonld,
    context_extra
} from './variables.js';


async function write_json(json, filepath) {
    try {
        await fs.writeFile(filepath, JSON.stringify(json, null, 4))
        console.log('success!')
    } catch (err) {
        console.error(err)
    }
}


async function resolve_parent_from_inchikey(inchikeys) {
    var new_json = new Array();
    let endpoint = "https://cfb.fiehnlab.ucdavis.edu/entities/";
    for (const inchikey of inchikeys) {
        const url = new URL(inchikey, endpoint).href
        let options = {json: true};
        const json_file = './source/chemont/entities/' + inchikey + '.json'
        const jsonld_file = './source/chemont/entities/jsonld/' + inchikey + '.jsonld'
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
                    //frameConceptScheme({"@graph": body, "@context": context}, jsonld_file, frame);
                    // do something with JSON, using the 'body' variable
                    //return {"@graph": body, "@context": context}
                    const object = {};
                    Object.keys(body).forEach(function(key) {
                        object[key] = clean_inchikey(key, body[key]);
                    })
                    new_json.push(object)
                }
                else {
                    write_json(body, './source/chemont/entities/error/' + inchikey + '.json');
                }
                ;
            });
        }
    }
    return {"@graph": new_json, "@context": context_extra}
}

async function parent_information() {
    const inchikeys = await inchikeys_from_csv()
    const jsonld = await resolve_parent_from_inchikey(inchikeys)
    //fs.writeFileSync('/home/gehau/git/codelijst-chemische_stof/src/main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_taxonomy-test.jsonld'
    //   , JSON.stringify(jsonld, null, 4));
    const nt = await n3_reasoning(jsonld, config.skos.rules)
    output('/home/gehau/git/codelijst-chemische_stof/src/main/resources/be/vlaanderen/data/ns/chemische_stof_shapes/shacl.ttl', nt, chemont_ttl, chemont_jsonld)
    console.log("parent information");
}


export { parent_information }


