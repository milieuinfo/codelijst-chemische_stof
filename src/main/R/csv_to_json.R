#!/usr/bin/Rscript
library(tidyr)
library(dplyr)
library(jsonlite)
library(stringr)

#setwd('/home/gehau/git/codelijst-chemische_stof/src/main/R')

library(svDialogs)


# functie om dataframe om te zetten naar jsonld
to_jsonld <- function(dataframe) {
  # lees context
  context <- jsonlite::read_json("../resources/source/codelijst_context.json")
  # jsonld constructie
  df_in_list <- list('@graph' = dataframe, '@context' = context)
  df_in_json <- toJSON(df_in_list, auto_unbox=TRUE)
  return(df_in_json)
}

expand_df_on_pipe <- function(dataframe) {
  # fix voor vctrs_error_incompatible in pubchem column
  df <- dataframe %>%
    mutate_all(list(~ str_c("", .)))
  # verdubbel rijen met pipe separator
  for(col in colnames(df)) {   # for-loop over columns
    df <- df %>%
      separate_rows(col, sep = "\\|")%>% 
      distinct()
  }
  return(df)
}

rename_columns <- function(df) {
  # rename columns
  df <- df %>%
    rename("@id" = uri,
           "@type" = type)
  return(df)
}

members_from_collection  <- function(df) {
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
  return(df)
}

hasTopConcept_from_topConceptOf  <- function(df) {
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
  return(df)
}

narrower_from_broader  <- function(df) {
  # narrower uit "inverse" relatie broader
  broaders <- na.omit(distinct(df['broader']))
  for (broad in as.list(broaders$broader)) {
    relation <- subset(df, broader == broad ,
                       select=c(uri, broader))
    narrowers <- as.list(relation["uri"])
    df2 <- data.frame(broad, narrowers)
    names(df2) <- c("uri","narrower")
    df <- bind_rows(df, df2)
  }
  return(df)
}

# lees csv
df <- read.csv(file = "../resources/source/codelijst_chemische_stof_source.csv", sep=",", na.strings=c("","NA"))

df <- expand_df_on_pipe(df)%>% 
  members_from_collection()%>%
  rename_columns()

#df <- narrower_from_broader(df)

# write volledig geexpandeerde csv, ter controle, deze wordt niet aan versiebeheer toegevoegd
write.csv(df,"../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof_separate_rows.csv", row.names = FALSE)

# bewaar jsonld
write(to_jsonld(df), "/tmp/chemische_stof.jsonld")

# serialiseer jsonld naar mooie turtle en mooie jsonld
# hiervoor dienen jena cli-tools geinstalleerd, zie README.md
system("riot --formatted=TURTLE /tmp/chemische_stof.jsonld > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl")
system("riot --formatted=JSONLD ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.jsonld")
system("riot --output=RDF/XML ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl > ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.rdf")
#system("shacl v --shapes ../resources/be/vlaanderen/omgeving/data/id/ontology/chemische-stof-ap-constraints/chemische-stof-ap-constraints.ttl --data ../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.ttl")


df_classification <- read.csv(file = "../resources/source/codelijst_chemische_stof_classification_source.csv", sep=",", na.strings=c("","NA"))
# verwijder kolom stof_uri en stof_uri_response
# # distinct rows
df_classification <-df_classification[ , -which(names(df_classification) %in% c("stof_uri", "stof_uri_response"))] %>%
  distinct() %>%
  expand_df_on_pipe()%>%
  members_from_collection()%>%
  hasTopConcept_from_topConceptOf()%>%
  rename_columns()

write(to_jsonld(df_classification), "/tmp/classification.jsonld")
system("riot --formatted=TURTLE /tmp/classification.jsonld > ../chemont/turtle/skos_chemont_2_1_verrijkt.ttl")



