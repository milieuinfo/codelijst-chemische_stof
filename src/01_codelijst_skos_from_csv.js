'use strict';
import {  generate_skos } from 'maven-metadata-generator-npm';
import { parent_information } from "./utils/chemont_to_skos.js"
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
generate_skos(ttl, jsonld, nt, csv);

parent_information(chemont_ttl, chemont_jsonld)

chebi_information(chebi_ttl, chebi_jsonld)

