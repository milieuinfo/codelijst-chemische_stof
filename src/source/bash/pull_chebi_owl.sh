#!/bin/bash




pushd ../chebi

curl -O https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/chebi.owl.gz
curl -O https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/chebi_lite.owl.gz
curl -O https://ftp.ebi.ac.uk/pub/databases/chebi/ontology/chebi_core.owl.gz
gzip -d *.gz

popd