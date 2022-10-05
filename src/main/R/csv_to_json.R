#!/usr/bin/Rscript
library(tidyr)
library(dplyr)
library(jsonlite)
library(stringr)

# lees csv
df <- read.csv(file = "../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv", sep=",", na.strings=c("","NA"))
# fix voor vctrs_error_incompatible in pubchem column
df <- df %>%
  mutate_all(list(~ str_c("", .)))
# verdubbel rijen met pipe separator
for(col in colnames(df)) {   # for-loop over columns
  df <- df %>%
    separate_rows(col, sep = "\\|")%>% 
    distinct()
}
# members van collection uit "inverse" relatie
collections <- na.omit(distinct(df['collection']))
for (col in as.list(collections$collection)) {
  medium <- subset(df, collection == col ,
                   select=c(uri, collection)) 
  medium_members <- as.list(medium["uri"])
  df2 <- data.frame(col, medium_members)
  names(df2) <- c("uri","member")
  df <- bind_rows(df, df2)
}
# hasTopConcept relatie uit inverse relatie
schemes <- na.omit(distinct(df['topConceptOf']))
for (scheme in as.list(schemes$topConceptOf)) {
  topconceptof <- subset(df, topConceptOf == scheme ,
                select=c(uri, topConceptOf))
  hastopconcept <- as.list(topconceptof["uri"])
  df2 <- data.frame(scheme, hastopconcept)
  names(df2) <- c("uri","hasTopConcept")
  df <- bind_rows(df, df2)
}
df <- df %>%
  rename("@id" = uri,
         "@type" = type)
# write volledig geexpandeerde csv, ter controle, deze wordt niet aan versiebeheer toegevoegd
write.csv(df,"../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_separate_rows.csv", row.names = FALSE)
# lees context
context <- jsonlite::read_json("../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/context.json")
# jsonld constructie
df_in_list <- list('@graph' = df, '@context' = context)
df_in_json <- toJSON(df_in_list, auto_unbox=TRUE)
# bewaar jsonld
write(df_in_json, "/tmp/chemische_stof.jsonld")

# serialiseer jsonld naar mooie turtle en mooie jsonld
# hiervoor dienen jena cli-tools geinstalleerd, zie README.md
system("riot --formatted=TURTLE /tmp/chemische_stof.jsonld > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl")
system("riot --formatted=JSONLD ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.jsonld")
system("shacl v --shapes ../resources/be/vlaanderen/omgeving/data/id/ontology/chemische-stof-ap-constraints/chemische-stof-ap-constraints.ttl --data ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl")