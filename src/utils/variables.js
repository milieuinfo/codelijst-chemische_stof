'use strict';
import yaml from 'js-yaml';
import fs, {readFileSync} from "fs";
import rdf from "@zazuko/env-node";
import {metadataOptions, shapes_dcat, dcat_rules, frame_catalog} from "@milieuinfo/maven-metadata-generator-npm/src/utils/variables.js";


const config = yaml.load(fs.readFileSync('./source/config.yml', 'utf8'));

const virtuoso = config.deploy.virtuoso ;

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

// Elke property die naar een IRI verwijst (@type: @id in context.json) krijgt "@embed": "@never",
// zodat de frames nooit nodes nesten. Expliciet opgegeven property-frames in de frame zelf
// (bv. met een extra @type-filter) gaan voor.
const embedNever = { "@embed": "@never", "@omitDefault": true };
const iriTerms = Object.entries(context)
    .filter(([term, def]) => typeof def === "object" && def["@type"] === "@id"
        && typeof def["@id"] === "string" && !def["@id"].startsWith("@"))
    .map(([term]) => term);
const withEmbedNever = (frame) => Object.assign(
    Object.fromEntries(iriTerms.map(term => [term, { ...embedNever }])),
    frame
);

const frame_skos_prefixes = withEmbedNever({
    "@context": context_prefixes,
    "@type": ["rdfs:Resource", "skos:ConceptScheme", "skos:Concept", "http://qudt.org/schema/qudt/QuantityKind"],
    "pubchem": {
        "@embed": "@never",
        "@omitDefault": true
    },
    "source": {
        "@embed": "@never",
        "@omitDefault": true
    },
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

})
const frame_chebi = {
    "@context": context_extra,
    "@type": ["http://www.w3.org/2004/02/skos/core#Concept"]
}

const frame_skos_no_prefixes = withEmbedNever({
    "@context": context,
    "@type": ["http://www.w3.org/2004/02/skos/core#ConceptScheme", "http://www.w3.org/2004/02/skos/core#Collection", "http://www.w3.org/2004/02/skos/core#Concept"],
    "pubchem": {
        "@embed": "@never",
        "@omitDefault": true
    },
    "source": {
        "@embed": "@never",
        "@omitDefault": true
    },
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

})



const turtlePath = config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.turtle

const ntriplesPath = config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.nt

const jsonldOptions = {"file": config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.jsonld, "frame": frame_skos_prefixes}

const csvOptions = {"file": config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.csv, "frame": frame_skos_no_prefixes}

const jsonOptions = {"file": config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.json, "frame": frame_skos_no_prefixes}

const parquetOptions = {"file": config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.parquet, "frame": frame_skos_no_prefixes}

const skos_prefixes = Object.assign( {}, config.skos.prefixes, config.prefixes, { '@base' : config.skos.prefixes.concept })

const skos_context = JSON.parse(readFileSync(config.source.path + config.source.context));

const jsonld = [config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.jsonld, frame_skos_prefixes]

const csv = [config.skos.path + config.skos.name + '/' + config.skos.name + config.skos.csv, frame_skos_no_prefixes]

const chemont_tax_ttl = config.skos.path + config.skos.name + '/' + config.skos.name + '_chemont_taxonomy' + config.skos.turtle

const chemont_tax_jsonld = [config.skos.path + config.skos.name + '/' + config.skos.name + '_chemont_taxonomy' + config.skos.jsonld, frame_skos_prefixes]

const chemont_ttl = config.skos.path + config.skos.name + '/' + config.skos.name + '_chemont_classificationlevels' + config.skos.turtle

const chemont_jsonld = [config.skos.path + config.skos.name + '/' + config.skos.name + '_chemont_classificationlevels' + config.skos.jsonld, frame_skos_prefixes]

const chebi_ttl = config.skos.path + config.skos.name + '/' + config.skos.name + '_chebi' + config.skos.turtle

const chebi_jsonld = [config.skos.path + config.skos.name + '/' + config.skos.name + '_chebi' + config.skos.jsonld, frame_skos_prefixes]

const shapes_skos = await rdf.dataset().import(rdf.fromFile(config.ap.path + config.ap.name + '-' + config.ap.type + '/' + config.ap.name + '-' + config.ap.type + config.ap.turtle))

const shapes_skos_chebi = await rdf.dataset().import(rdf.fromFile(config.ap.path + config.ap.name + '-' + config.ap.type + '/' + config.ap.name + '_chebi-' + config.ap.type + config.ap.turtle))


const dcat_dataset_jsonld = '../temp/' + config.dcat.path_dataset + metadataOptions.artifactId + '/' + config.dcat.dataset_jsonld

const dcat_dataset_turtle = '../temp/' + config.dcat.path_dataset + metadataOptions.artifactId + '/' + config.dcat.dataset_turtle

const dcat_catalog_jsonld = '../temp/' + config.dcat.path_catalog + metadataOptions.artifactId + '/' + config.dcat.catalog_jsonld

const dcat_catalog_turtle = '../temp/' + config.dcat.path_catalog + metadataOptions.artifactId + '/' + config.dcat.catalog_turtle

const datasetOptions = {
    "turtlePath": dcat_dataset_turtle,
    "jsonldOptions": {"file": dcat_dataset_jsonld, "frame": frame_catalog}
}

const dcat_dataset_odcs = '../temp/' + config.dcat.path_dataset + metadataOptions.artifactId + '/' + (config.dcat.dataset_odcs ?? 'dataset.odcs.yaml')

const odcsOptions = {
    "file": dcat_dataset_odcs
}

const catalogOptions = {
    "turtlePath": dcat_catalog_turtle,
    "jsonldOptions": {"file": dcat_catalog_jsonld, "frame": frame_catalog}
}

const skosOptions = {
    "turtlePath": turtlePath,
    "jsonOptions": jsonOptions,
    "jsonldOptions": jsonldOptions,
    "ntriplesPath": ntriplesPath,
    "csvOptions": csvOptions,
    "parquetOptions": parquetOptions,
    //"xsdOptions": xsdOptions
}

const skosSource = {
    "sourcePaths": config.source.codelijst_csv.map(csv => config.source.path + csv),
    "contextPrefixes": Object.assign({},skos_context , skos_prefixes),
    "rules": config.skos.rules,
    "shapesDataset": await rdf.dataset().import(rdf.fromFile(config.ap.path + config.ap.name + '-' + config.ap.type + '/' + config.ap.name + '-' + config.ap.type + config.ap.turtle)),
    "prefixes": Object.assign( {}, config.skos.prefixes, config.prefixes)
}

// ODCS data contract voor de parquet-distributie: kolommen uit het parquet-bestand,
// predicaten uit de JSON-LD-context, omschrijvingen uit de SHACL-shapes van het AP
const odcsSource = {
    "config": config,
    "parquetFile": parquetOptions.file,
    "context": skos_context,
    "shapesDataset": skosSource.shapesDataset,
    "prefixes": skos_prefixes
}

const metadataSource = {
    "shapesDataset": shapes_dcat,
    "rules": dcat_rules,
    "prefixes": config.prefixes
}

// Verrijking: ChemOnt-taxonomie (classyfire) en ChEBI, als aparte bestanden naast de codelijst.
const enrichmentPrefixes = Object.assign({}, config.skos.prefixes, config.prefixes)

const chemontSource = {
    "shapesDataset": await rdf.dataset().import(rdf.fromFile(config.ap.chemont)),
    "prefixes": enrichmentPrefixes
}

const chebiSource = {
    "shapesDataset": shapes_skos_chebi,
    "prefixes": enrichmentPrefixes
}

const chemontTaxonomyOptions = {
    "turtlePath": chemont_tax_ttl,
    "jsonldOptions": {"file": chemont_tax_jsonld[0], "frame": frame_skos_prefixes}
}

const chemontLevelsOptions = {
    "turtlePath": chemont_ttl
}

const chebiOptions = {
    "turtlePath": chebi_ttl,
    "jsonldOptions": {"file": chebi_jsonld[0], "frame": frame_skos_prefixes}
}


export {
    virtuoso,
    skosOptions,
    skosSource,
    metadataSource,
    metadataOptions,
    datasetOptions,
    catalogOptions,
    odcsSource,
    odcsOptions,
    config,
    context_extra,
    frame_chebi,
    chemontSource,
    chemontTaxonomyOptions,
    chemontLevelsOptions,
    chebiSource,
    chebiOptions
};
// export {
//     chemont_tax_jsonld,
//     chemont_tax_ttl,
//     shapes_skos,
//     prefixes_chebi,
//     frame_chebi,
//     config,
//     ttl,
//     nt,
//     jsonld,
//     csv,
//     chemont_jsonld,
//     chemont_ttl,
//     chebi_jsonld,
//     chebi_ttl,
//     context_extra,
//     shapes_skos_chebi,
//     virtuoso
// };