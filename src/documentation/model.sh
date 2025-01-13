#!/bin/bash  

  riot --formatted=turtle ../main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/*ttl > /tmp/chemische_stof.ttl
  sparql --results=TTL --data=/tmp/chemische_stof.ttl  --query model.rq  > model.ttl
  rdf2dot  model.ttl | dot -Tpng > model.png
  rdf2dot  model.ttl  > model.dot
