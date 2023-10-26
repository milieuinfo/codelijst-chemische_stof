#!/bin/bash

# Transform csv, ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv
# to jsonld, /tmp/chemische_stof.jsonld
Rscript ../R/csv_to_postgres.R
