import json
import pandas as pd

def string_split(x):
    try:
        return  x.split('|')
    except:
        return x

def expand_df_on_pipe(df):
    for col in df.columns:
        df[col] = df[col].apply(lambda x: string_split(x))
        df = df.explode(col)
    return df.drop_duplicates()

def rename_columns(df):
    return df.rename(columns={"uri": "@id", "type": "@type"})

def members_from_collection(df):
    # members van collection uit "inverse" relatie
    collections = df['collection'].dropna().unique()
    for col in collections:
        medium = df[df['collection'] == col][['uri', 'collection']]
        medium_members = medium['uri'].tolist()
        df2 = pd.DataFrame({'type': 'skos:Collection','uri': col, 'member': medium_members})
        df = pd.concat([df, df2])
    return df

def hasTopConcept_from_topConceptOf(df):
    # hasTopConcept relatie uit inverse relatie
    schemes = df[df['topConceptOf'].notnull()]['topConceptOf'].unique()
    for scheme in schemes:
        topconceptof = df[df['topConceptOf'] == scheme][['uri', 'topConceptOf']]
        hastopconcept = topconceptof['uri'].tolist()
        df2 = pd.DataFrame({'type': 'skos:Concept','uri': scheme, 'hasTopConcept': hastopconcept})
        df = pd.concat([df, df2])
    return df

def narrower_from_broader(df):
    # narrower uit "inverse" relatie broader
    broaders = df[['broader']].dropna()
    broaders = broaders.drop_duplicates()
    for broad in broaders['broader']:
        relation = df[df['broader'] == broad][['uri','broader']]
        narrowers = relation['uri']
        df2 = pd.DataFrame({'type': 'skos:Concept','uri':broad, 'narrower':narrowers})
        df = pd.concat([df, df2])
    return df

def to_jsonld(df):
    result = df.to_json(orient="table")
    data = json.loads(result)['data']
    context = json.load(open("../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/context.json"))
    df_in_list = {'@graph': data, '@context': context}
    df_in_json = json.dumps(df_in_list, ensure_ascii=False)
    return df_in_json



df = pd.read_csv("../resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv", sep=",", na_values=["", "NA"])
df = members_from_collection(df)
df = hasTopConcept_from_topConceptOf(df)
df = narrower_from_broader(df)
df = rename_columns(df)
df = expand_df_on_pipe(df)



with open("/tmp/chemische_stof.jsonld", "w") as f:
    jsonld = to_jsonld(df)
    f.write(jsonld)