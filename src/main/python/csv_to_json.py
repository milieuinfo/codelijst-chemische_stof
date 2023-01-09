import json
import pandas as pd
from functions.functions import *
context = json.load(open("../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/context.json"))
df = pd.read_csv("../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv", sep=",", na_values=["", "NA"])
df = members_from_collection(df)
df = hasTopConcept_from_topConceptOf(df)
df = narrower_from_broader(df)
df = rename_columns(df)
df = expand_df_on_pipe(df)



with open("/tmp/chemische_stof.jsonld", "w") as f:
    jsonld = to_jsonld(df, context)
    f.write(jsonld)