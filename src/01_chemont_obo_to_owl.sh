#!/bin/bash

#dit scriptje maakt gebruik van robot, een javatool https://github.com/ontodev/robot
#git clone en een mvn clean install voor gebruik
# zet obo bestand uit http://classyfire.wishartlab.com/system/downloads/1_0/chemont/ChemOnt_2_1.obo.zip
# om in turtle
echo "convert obo to owl-model"
/opt/robot/bin/robot convert -i 'source/chemont/ChemOnt_2_1.obo'  --format ttl -o 'source/chemont/ChemOnt_2_1.ttl'

# zet Turtle om naar skos-model
#echo "convert owl-model to skos model"
#sparql --results=TURTLE --data=source/chemont/ChemOnt_2_1.ttl  --query source/sparql/chemont_to_skos.rq  > 'source/chemont/skos_chemont_2_1.ttl'
#riot --formatted=TURTLE  'source/chemont/skos_chemont_2_1.ttl' 'main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_parent.ttl' > /tmp/test.ttl
#sparql --results=TURTLE --data=/tmp/test.ttl  --query source/sparql/broader_relations.rq  > 'main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_hierarchy.ttl'
#
#sparql --results=TURTLE --data='main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_hierarchy.ttl'  --query source/sparql/chemont_to_xkos.rq > 'main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_chemont_classificationlevels.ttl'

