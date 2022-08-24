#!/bin/bash
Rscript -e '
library(tidyr)
library(dplyr)
library(jsonlite)

df <- read.csv(file = "../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv", sep=",", na.strings=c("","NA"))

df <- df %>%
  separate_rows(casNumbers, sep = "\\|")%>%
  separate_rows(notations, sep = "\\|")%>%
  separate_rows(altLabels, sep = "\\|")%>%
  separate_rows(exactMatches, sep = "\\|")%>%
  separate_rows(isSubjectOfs, sep = "\\|")%>%
  separate_rows(collections, sep = "\\|")%>%
  separate_rows(vmmParameterIds, sep = "\\|")%>% 
  separate_rows(types, sep = "\\|")%>% 
  rename(
    casNumber = casNumbers,
    notation = notations,
    altLabel = altLabels,
    exactMatch = exactMatches,
    isSubjectOf = isSubjectOfs,
    collection = collections,
    vmmParameterId = vmmParameterIds,
    "@type" = types
  )
for (col in list("https://data.omgeving.vlaanderen.be/id/collection/chemische_stof/water","https://data.omgeving.vlaanderen.be/id/collection/chemische_stof/lucht")) {
  medium <- subset(df, collection == col ,
                   select=c(uri, collection)) 
  medium_members=as.list(medium["uri"])
  df2<-data.frame(col, medium_members)
  names(df2)<-c("uri","member")
  df <- bind_rows(df, df2)
}
df <- df %>%
  rename("@id" = uri)
write.csv(df,"../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_separate_rows.csv", row.names = FALSE)
df_in_json <- jsonlite::toJSON(df)
write(df_in_json, "/tmp/chemische_stof.json")
' 

echo '{"@graph" :' > /tmp/chemische_stof.jsonld
cat /tmp/chemische_stof.json  >> /tmp/chemische_stof.jsonld
echo ',
  "@context" : ' >> /tmp/chemische_stof.jsonld
cat '../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/context.json' >> /tmp/chemische_stof.jsonld
echo '
}
' >> /tmp/chemische_stof.jsonld

riot --formatted=TURTLE /tmp/chemische_stof.jsonld   > '../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl' 

riot --formatted=JSONLD '../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl'   > '../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.jsonld' 

