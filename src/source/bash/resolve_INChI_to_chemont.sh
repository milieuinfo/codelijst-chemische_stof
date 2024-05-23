#!/bin/bash



cat ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl | grep 'dbp:inchikey' | cut -d '"' -f 2 > /tmp/InChIKey



pushd ../chemont

while read i ; do
  curl -O https://cfb.fiehnlab.ucdavis.edu/entities/${i} ;
done < /tmp/InChIKey

popd


