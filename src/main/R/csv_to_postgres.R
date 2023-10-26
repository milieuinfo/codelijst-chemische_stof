library(RPostgreSQL)
library(tidyr)
# library(diffdf)
library(dplyr)
library(stringr)
# library(ggplot2)
# library(digest)
# library(readxl)
# library(arrow)

setwd('/home/gehau/git/codelijst-chemische_stof/src/main/R')


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


#database connectie
# https://hevodata.com/learn/rpostgresql/
dsn_database = "datawarehouse_ontwikkel"   # Specify the name of your Database
# Specify host name e.g.:"aws-us-east-1-portal.4.dblayer.com"
dsn_hostname = "datawarehouse-postgres-on-1.vm.cumuli.be"
dsn_port = "5432"                # Specify your port number. e.g. 98939
dsn_uid = "postgres"         # Specify your username. e.g. "admin"
dsn_pwd = "P0stgr3sDBu5er"        # Specify your password. e.g. "xxx"

tryCatch({
  drv <- dbDriver("PostgreSQL")
  print("Connecting to Database…")
  connec <- dbConnect(drv,
                      dbname = dsn_database,
                      host = dsn_hostname,
                      port = dsn_port,
                      user = dsn_uid,
                      password = dsn_pwd)
  print("Database Connected!")
},
  error=function(cond) {
    print("Unable to connect to Database.")
  })

dbGetQuery(connec,
           "SELECT table_name FROM information_schema.tables
                   WHERE table_schema='b_reference'")
dbListFields(connec, c("b_reference", "codelijst_chemische_stof"))

df <- read.csv(file = "../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv", sep=",", fileEncoding = "UTF-8")
df <- df %>% mutate_all(~na_if(., ''))
df <- df %>% arrange(uri)

dbSendQuery(connec, "TRUNCATE b_reference.codelijst_chemische_stof;")

dbWriteTable(connec, c("b_reference", "codelijst_chemische_stof"), df, overwrite = FALSE, row.names = FALSE, append = TRUE)

df_denormalized <- expand_df_on_pipe(df) 
df_denormalized <- df_denormalized %>% distinct()
df_denormalized <- df_denormalized %>% mutate_all(~na_if(., ''))
df_denormalized <- df_denormalized %>% arrange(inchikey)

dbSendQuery(connec, "TRUNCATE b_reference.codelijst_chemische_stof_denormalized;")

dbWriteTable(connec, c("b_reference", "codelijst_chemische_stof_denormalized"), df_denormalized, overwrite = FALSE, row.names = FALSE, append = TRUE)


dbDisconnect(connec)



