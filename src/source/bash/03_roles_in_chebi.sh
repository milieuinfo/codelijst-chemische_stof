#!/bin/bash

riot --output=turtle ../chebi/chebi.owl ../../main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/*ttl > ../chebi/chebiplusskos.ttl
sparql --results=TTL --data=../chebi/chebiplusskos.ttl  --query ../sparql/chebi_rollen.rq  > ../../main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/roles.ttl
