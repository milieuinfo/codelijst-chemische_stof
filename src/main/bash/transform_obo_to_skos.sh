#!/bin/bash

#dit scriptje maakt gebruik van robot, een javatool https://github.com/ontodev/robot
#git clone en een mvn clean install voor gebruik
# zet obo bestand http://classyfire.wishartlab.com/system/downloads/1_0/chemont/ChemOnt_2_1.obo.zip
# om in turtle

/opt/robot/bin/robot convert -i '../chemont/obo/ChemOnt_2_1.obo'  --format ttl -o '../chemont/turtle/ChemOnt_2_1.ttl'

# zet Turtle om naar skos-model

sparql --results=TURTLE --data=../chemont/turtle/ChemOnt_2_1.ttl  --query ../sparql/chemont_to_skos.rq | sed -e 's;http://purl.obolibrary.org/obo/;https://data.omgeving.vlaanderen.be/id/concept/chemische_stof/;'> '../chemont/turtle/skos_chemont_2_1.ttl'

# filter er die delen uit die echt van toepassing zijn

riot --formatted=TURTLE ../chemont/turtle/skos_chemont_2_1.ttl ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl > /tmp/cs.ttl

sparql --results=TURTLE --data=/tmp/cs.ttl  --query ../sparql/beperk_chemont.rq > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_taxonomy.ttl

riot --formatted=JSONLD ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_taxonomy.ttl > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_taxonomy.jsonld