#!/bin/bash

# Transform csv, ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv
# to jsonld, /tmp/chemische_stof.jsonld
Rscript ../R/csv_to_json.R
shacl v --shapes ../resources/be/vlaanderen/omgeving/data/id/ontology/chemische-stof-ap-constraints/chemische-stof-beperkt-ap-constraints.ttl --data ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl
