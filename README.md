# codelijst-chemische_stof

## Samenvatting

Dit project bevat een codelijst met eenduidige benamingen van chemische stoffen en tools om deze lijst te beheren en om te zetten naar webformaten.

## Model
![Model](src/main/documentation/model.png)
## Gebruik

- Voeg een definitie van een nieuwe chemische stof toe aan $PROJECT_HOME/src/main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv

### csv naar rdf
```
cd $PROJECT_HOME/src/main/bash
bash csv_to_rfd.sh
```
### rdf naar csv
```
cd $PROJECT_HOME/src/main/sparql
sparql --results=CSV --data=../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl  --query rdf_to_csv.rq > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv
```

## Dependencies

**_RDF tools:_**

In dit project worden twee jena cli-tools gebruikt: riot en sparql.
Sparql wordt gebruikt om het rdf-formaat om te zetten naar csv, riot wordt gebruikt om de rdf-formaten om te zetten, e.i. json-ld naar turtle.
- Lees eerst [deze documentatie](https://jena.apache.org/documentation/tools/index.html).
- Installeer de jena [binaries](https://dlcdn.apache.org/jena/binaries/).
Bijvoorbeeld:
```
curl -O https://dlcdn.apache.org/jena/binaries/apache-jena-4.6.0.tar.gz
tar -xf apache-jena-4.6.0.tar.gz -C /opt
echo 'export PATH="/opt/apache-jena-4.6.0/bin:$PATH"' >> ~/.bashrc
. ~/.bashrc
```

**_R:_**

Met behulp van de tidyverse bibliotheek in R wordt de csv omgezet naar jsonld.
```
sudo apt install r-base build-essential r-cran-jsonlite r-cran-tidyr r-cran-dplyr
```
