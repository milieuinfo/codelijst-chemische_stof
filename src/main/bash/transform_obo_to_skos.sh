#!/bin/bash

#dit scriptje maakt gebruik van robot, een javatool https://github.com/ontodev/robot
#git clone en een mvn clean install voor gebruik
# zet obo bestand uit http://classyfire.wishartlab.com/system/downloads/1_0/chemont/ChemOnt_2_1.obo.zip
# om in turtle
echo "convert obo to owl-model"
/opt/robot/bin/robot convert -i '../chemont/obo/ChemOnt_2_1.obo'  --format ttl -o '../chemont/turtle/ChemOnt_2_1.ttl'

# zet Turtle om naar skos-model
echo "convert owl-model to skos model"
sparql --results=TURTLE --data=../chemont/turtle/ChemOnt_2_1.ttl  --query ../sparql/chemont_to_skos.rq | sed -e 's;http://purl.obolibrary.org/obo/;https://data.omgeving.vlaanderen.be/id/concept/chemische_stof/;' > '/tmp/skos_chemont_2_1_a.ttl'
sparql --results=TURTLE --data=../chemont/turtle/ChemOnt_2_1.ttl  --query ../sparql/chemont_to_skos_schema.rq  > '/tmp/skos_chemont_2_1_b.ttl'
riot --formatted=TURTLE  '/tmp/skos_chemont_2_1_b.ttl' '/tmp/skos_chemont_2_1_b.ttl' > '../chemont/turtle/skos_chemont_2_1.ttl'

# filter er die delen uit die echt van toepassing zijn

echo "trim skos model, only substances have parents"
riot --formatted=TURTLE ../chemont/turtle/skos_chemont_2_1.ttl ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl > /tmp/cs.ttl

sparql --results=TURTLE --data=/tmp/cs.ttl  --query ../sparql/beperk_chemont.rq > /tmp/cs2.ttl

echo "narrower form broader relations"
sparql --results=TURTLE --data=/tmp/cs2.ttl  --query ../sparql/narrower_from_broader.rq > /tmp/cs3.ttl

riot --formatted=TURTLE /tmp/cs2.ttl /tmp/cs3.ttl > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_taxonomy.ttl

riot --formatted=JSONLD ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_taxonomy.ttl > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_taxonomy.jsonld