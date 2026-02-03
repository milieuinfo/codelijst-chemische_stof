'use strict';
import {  generate_skos } from '@milieuinfo/maven-metadata-generator-npm';
//import { chemont_taxonomy_to_skos } from "./utils/chemont_to_skos.js"
//import {chebi_information} from "./utils/chebi_to_skos.js"
import {
    // ttl,
    // nt,
    // jsonld,
    // csv,
    //chebi_jsonld,
    //chebi_ttl,
    skosOptions,
    skosSource
} from './utils/variables.js';
//console.log = function() {}
//var DEBUG = false;
// if(!DEBUG){
//     console.log = function() {}
// }
generate_skos(skosOptions, skosSource);
//chemont_taxonomy_to_skos()
//chebi_information(chebi_ttl, chebi_jsonld)

