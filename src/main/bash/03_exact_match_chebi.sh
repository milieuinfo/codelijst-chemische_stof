#!/bin/bash

echo "construct file exact_match_chebi.ttl"

pushd ../chebi
echo "Download chebi owl"
curl -O https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/chebi.owl.gz
#curl -O https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/chebi_lite.owl.gz
#curl -O https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/chebi_core.owl.gz
gzip -d *.gz
echo "merge chebi and chemische stof"
riot --output=TURTLE ../chebi/chebi.owl  ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl >  /tmp/chebi.ttl
echo "query exact match"
sparql --results=TURTLE --data=/tmp/chebi.ttl  --query ../sparql/exact_match_chebi.rq  > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/exact_match_chebi.ttl
echo "make jsonld"
riot --formatted=JSONLD ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/exact_match_chebi.ttl >  ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/exact_match_chebi.jsonld
rm ../chebi/*.owl
popd