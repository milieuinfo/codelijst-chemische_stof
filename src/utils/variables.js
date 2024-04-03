'use strict';
import yaml from 'js-yaml';
import fs, {readFileSync} from "fs";

const config = yaml.load(fs.readFileSync('./source/config.yml', 'utf8'));

const prefixes = Object.assign( {}, config.skos.prefixes, config.prefixes, { '@base' : config.skos.prefixes.concept })

const context = JSON.parse(fs.readFileSync(config.source.path + config.source.context));

const context_prefixes = Object.assign({},context , prefixes)

const context_extra = JSON.parse(readFileSync('./utils/context.json'));

const prefixes_chebi = {
    altLabel_en : {
        "@id" : "http://www.w3.org/2004/02/skos/core#altLabel",
        "@language" : "en"
    },
    note_en : {
        "@id" : "http://www.w3.org/2004/02/skos/core#note",
        "@language" : "en"
    },
    geneontology : "http://www.geneontology.org/formats/oboInOwl#",
    rdfs : "http://www.w3.org/2000/01/rdf-schema#",
    obo : "http://purl.obolibrary.org/obo/",
    uniprot : "http://purl.uniprot.org/",
    owl : "http://www.w3.org/2002/07/owl#",
    concept: "https://data.omgeving.vlaanderen.be/id/concept/chemische_stof/",
    chebi : "http://purl.obolibrary.org/obo/chebi/",
    skos: "http://www.w3.org/2004/02/skos/core#",
    dbo: "http://dbpedia.org/ontology/",
    dbp: "http://dbpedia.org/property/",

    graph : {
    "@id" : "@graph"
    }
}

const frame_skos_prefixes = {
    "@context": context_prefixes,
    "@type": ["rdfs:Resource", "skos:ConceptScheme", "skos:Collection", "skos:Concept"],
    "member": {
        "@type": "skos:Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "inScheme": {
        "@type": "skos:ConceptScheme",
        "@embed": "@never",
        "@omitDefault": true
    },
    "topConceptOf": {
        "@type": "skos:ConceptScheme",
        "@embed": "@never",
        "@omitDefault": true
    },
    "broader": {
        "@type": "skos:Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "narrower": {
        "@type": "skos:Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "hasTopConcept": {
        "@type": "skos:Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "references":{
        "@embed": "@never",
            "@omitDefault": true
    },
    "isReferencedBy":{
        "@embed": "@never",
            "@omitDefault": true
    },
    "relation":{
        "@embed": "@never",
            "@omitDefault": true
    },
    "broaderTransitive" : {
        "@embed": "@never",
        "@omitDefault": true
    },
    "broadMatch" : {
        "@embed": "@never",
        "@omitDefault": true
    },
    "closeMatch" : {
        "@embed": "@never",
        "@omitDefault": true
    },
    "exactMatch" : {
        "@embed": "@never",
        "@omitDefault": true
    },
    "mappingRelation" : {
        "@embed": "@never",
        "@omitDefault": true
    },
    "narrowerTransitive" : {
        "@embed": "@never",
        "@omitDefault": true
    },
    "semanticRelation" : {
        "@embed": "@never",
        "@omitDefault": true
    },
    "narrowMatch" : {
        "@embed": "@never",
        "@omitDefault": true
    },

}
const frame_chebi = {
    "@context": context_extra,
    "@type": ["http://www.w3.org/2004/02/skos/core#Concept"]
}

const frame_skos_no_prefixes = {
    "@context": context,
    "@type": ["http://www.w3.org/2004/02/skos/core#ConceptScheme", "http://www.w3.org/2004/02/skos/core#Collection", "http://www.w3.org/2004/02/skos/core#Concept"],
    "member": {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "inScheme": {
        "@type": "http://www.w3.org/2004/02/skos/core#ConceptScheme",
        "@embed": "@never",
        "@omitDefault": true
    },
    "topConceptOf": {
        "@type": "http://www.w3.org/2004/02/skos/core#ConceptScheme",
        "@embed": "@never",
        "@omitDefault": true
    }
    ,
    "broader": {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    }
    ,
    "narrower": {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "hasTopConcept": {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "references":{
        "@embed": "@never",
        "@omitDefault": true
    },
    "isReferencedBy":{
        "@embed": "@never",
        "@omitDefault": true
    },
    "relation":{
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "broaderTransitive" : {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "broadMatch" : {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "closeMatch" : {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "exactMatch" : {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "mappingRelation" : {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "narrowerTransitive" : {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "narrowMatch" : {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },
    "semanticRelation" : {
        "@type": "http://www.w3.org/2004/02/skos/core#Concept",
        "@embed": "@never",
        "@omitDefault": true
    },

}

const ttl = config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.turtle

const nt = config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.nt

const jsonld = [config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.jsonld, frame_skos_prefixes]

const csv = [config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.csv, frame_skos_no_prefixes]

const chemont_ttl = config.skos.path + config.skos.name + '/' + config.skos.name + '_chemont_taxonomy' + config.skos.turtle

const chemont_jsonld = [config.skos.path + config.skos.name + '/' + config.skos.name + '_chemont_taxonomy' + config.skos.jsonld, frame_skos_prefixes]

const chebi_ttl = config.skos.path + config.skos.name + '/' + config.skos.name + '_chebi' + config.skos.turtle

const chebi_jsonld = [config.skos.path + config.skos.name + '/' + config.skos.name + '_chebi' + config.skos.jsonld, frame_skos_prefixes]


export {
    prefixes_chebi,
    frame_chebi,
    config,
    ttl,
    nt,
    jsonld,
    csv,
    chemont_jsonld,
    chemont_ttl,
    chebi_jsonld,
    chebi_ttl,
    context_extra
};