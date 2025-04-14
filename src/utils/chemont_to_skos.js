import fs from 'fs-extra';
import request from 'request';
import { inchikeys_from_csv , clean_inchikey } from './inchikeys.js'
import {n3_reasoning, output} from "maven-metadata-generator-npm";
import {readFileSync} from "fs";
import rdf from "@zazuko/env-node";
import { QueryEngine } from "@comunica/query-sparql-rdfjs";
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
import path from "path";
//import {artifactId} from "maven-metadata-generator-npm/src/utils/variables";
import jsonld from "jsonld";


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
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
            await delay(5000)
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
    const chemont = await rdf.dataset().import(rdf.fromFile(config.source.chemont))
    const store = RdfStore.createDefault();
    chemont._quads.forEach(async (quad) => {
        store.addQuad(quad)
    });
    const myEngine = new QueryEngine();
    var query = fs.readFileSync(config.skos.sparql.chemont_skos, 'utf8')
    const nt_writer = new N3.Writer({ format: 'N-Triples' });
    const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: Object.assign({},config.skos.prefixes, config.prefixes ) });
    const quadStream = await myEngine.queryQuads(query, { sources: [store] });
    quadStream.on('data', (quad) => {
        ttl_writer.addQuad(quad);
        nt_writer.addQuad(quad);
    });
    quadStream.on('end', () => {
        nt_writer.end((error, result) => merge_taxonomy_and_parents(result));
        ttl_writer.end((error, result) => fs.writeFileSync(config.source.chemont_skos, result));
    });
}


async function merge_taxonomy_and_parents(chemont_taxonomy) {
    console.log('Merge turtle files to one n-triple file')
    const inchikeys = await inchikeys_from_csv()
    const json_ld = await resolve_parent_from_inchikey(inchikeys)
    const parents = await jsonld.toRDF(json_ld, { format: "application/n-quads" })
    const reasoner = RoxiReasoner.new();
    const rdf = await sortLines(chemont_taxonomy + '\n' + parents);
    reasoner.add_abox(rdf);
    const tax_p = await sortLines(reasoner.get_abox_dump())
    const merged_chemont_taxonomy_parents_store = RdfStore.createDefault();
    const parser = new N3.Parser();
    //const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: Object.assign({},config.skos.prefixes, config.prefixes ) });
    parser.parse(tax_p,
        (error, quad, prefixes) => {
            if (quad){
                merged_chemont_taxonomy_parents_store.addQuad(quad);
                //ttl_writer.addQuad(quad);
            }
            else {
                only_broader(merged_chemont_taxonomy_parents_store, parents)
                //ttl_writer.end((error, result) => fs.writeFileSync('/tmp/merge.ttl', result));
            }
        });
}

async function only_broader(store, parents){
    const myEngine = new QueryEngine();
    var query = fs.readFileSync(config.skos.sparql.broader_skos, 'utf8')
    const nt_writer = new N3.Writer({ format: 'N-Triples' });
    const quadStream = await myEngine.queryQuads(query, { sources: [store] });
    //const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: Object.assign({},config.skos.prefixes, config.prefixes ) });
    quadStream.on('data', (quad) => {
        nt_writer.addQuad(quad);
        //ttl_writer.addQuad(quad);
    });
    quadStream.on('end', () => {
        nt_writer.end((error, result) => reason_taxonomy(result, parents));
        //ttl_writer.end((error, result) => fs.writeFileSync('/tmp/broader.ttl', result));
    });
}
async function reason_taxonomy(my_taxonomy,parents) {
    console.log("n3 reasoning ");
    const rdf = await sortLines(my_taxonomy + '\n' + parents);
    const reasoner = RoxiReasoner.new();
    reasoner.add_abox(rdf);
    for (let rule in config.skos.rules) {
        reasoner.add_rules(fs.readFileSync(process.cwd() + config.skos.rules[rule], 'utf8'));
    }
    reasoner.materialize();
    const nt = await sortLines(reasoner.get_abox_dump());
    output(config.ap.chemont, nt, chemont_tax_ttl, chemont_tax_jsonld)
    const store = RdfStore.createDefault();
    const parser = new N3.Parser();
    parser.parse(nt,
        (error, quad, prefixes) => {
            if (quad){
                store.addQuad(quad);
            }
            else {
                chemont_taxonomy_to_xkos(store)
            }
        });
}

async function chemont_taxonomy_to_xkos(store){
    const myEngine = new QueryEngine();
    var query = fs.readFileSync(config.skos.sparql.chemont_xkos, 'utf8')
    const nt_writer = new N3.Writer({ format: 'N-Triples' });
    const quadStream = await myEngine.queryQuads(query, { sources: [store] });
    //const ttl_writer = new N3.Writer({ format: 'text/turtle' , prefixes: Object.assign({},config.skos.prefixes, config.prefixes ) });
    quadStream.on('data', (quad) => {
        nt_writer.addQuad(quad);
        //ttl_writer.addQuad(quad);
    });
    quadStream.on('end', () => {
        //ttl_writer.end((error, result) => fs.writeFileSync('/tmp/xkos.ttl', result));
        nt_writer.end((error, result) => sort(result));
    });
}

async function sort(rdf_input) {
    let rdf = await sortLines( rdf_input )
    fs.writeFileSync('/tmp/xkos.nt', rdf)
    output(config.ap.chemont, rdf, chemont_ttl)
}


export { chemont_taxonomy_to_skos }


