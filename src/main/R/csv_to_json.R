library(tidyr)
library(dplyr)
library(jsonlite)

df <- read.csv(file = "/home/gehau/svn/ontologies/oslo-omgeving-conceptschemes/trunk/src/main/resources/be/vlaanderen/data/id/conceptscheme/chemische_stof/chemische_stof.csv", sep=",", na.strings=c("","NA"))
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
write.csv(df,"/home/gehau/svn/ontologies/oslo-omgeving-conceptschemes/trunk/src/main/resources/be/vlaanderen/data/id/conceptscheme/chemische_stof/chemische_stof_separate_rows.csv", row.names = FALSE)
df_in_json <- jsonlite::toJSON(df)
write(df_in_json, "/tmp/chemische_stof.json")
