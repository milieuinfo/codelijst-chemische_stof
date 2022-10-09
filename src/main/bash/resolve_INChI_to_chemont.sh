#!/bin/bash

pushd ../chemont

while read i ; do curl -O https://cfb.fiehnlab.ucdavis.edu/entities/$i ; done < ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_inchikey.csv

popd


