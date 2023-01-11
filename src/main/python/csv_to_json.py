import json
import pandas as pd
from functions.functions import *
from rdflib import Graph, plugin

#g = Graph()
#g.parse("/tmp/chemische_stof.jsonld")

context = json.load(open("../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/context.json"))
df = pd.read_csv("../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv", sep=",", na_values=["", "NA"])
df = expand_df_on_pipe(df)
df = members_from_collection(df)
df = hasTopConcept_from_topConceptOf(df)
#df = narrower_from_broader(df)
df = rename_columns(df)
df = df.drop_duplicates()


jsonld = to_jsonld(df, context)
with open("/tmp/chemische_stof.jsonld", "w") as f:
    f.write(jsonld)



df_classification = pd.read_csv("../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/classification.csv", sep=",", na_values=["","NA"])
# verwijder kolom stof_uri en stof_uri_response
df_classification = df_classification.drop(["stof_uri", "stof_uri_response"], axis=1)
df_classification = df_classification.drop_duplicates()
df_classification = expand_df_on_pipe(df_classification)
df_classification = members_from_collection(df_classification)
df_classification = hasTopConcept_from_topConceptOf(df_classification)
df_classification = rename_columns(df_classification)
df_classification = df_classification.drop_duplicates()

with open("/tmp/classification.jsonld", "w") as f:
    jsonld = to_jsonld(df_classification, context)
    f.write(jsonld)