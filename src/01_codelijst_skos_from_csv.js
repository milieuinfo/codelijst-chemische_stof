'use strict';
import {  generate_skos } from 'maven-metadata-generator-npm';
import { parent_information, chemont_taxonomy_to_skos } from "./utils/chemont_to_skos.js"
import {chebi_information} from "./utils/chebi_to_skos.js"
import {
    ttl,
    nt,
    jsonld,
    csv,
    chemont_jsonld,
    chemont_ttl,
    chebi_jsonld,
    chebi_ttl
} from './utils/variables.js';
console.log = function() {}
//var DEBUG = false;
// if(!DEBUG){
//     console.log = function() {}
// }
generate_skos(ttl, jsonld, nt, csv);
chemont_taxonomy_to_skos()
parent_information()

chebi_information(chebi_ttl, chebi_jsonld)

