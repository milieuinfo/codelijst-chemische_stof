import org.apache.spark.sql.DataFrameWriter
import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import groovy.json.JsonSlurper;
import groovy.json.internal.LazyMap;
import groovy.json.JsonBuilder;
import org.apache.spark.sql.functions.*;
import spark.sqlContext.implicits.*;
import org.apache.spark.sql.Column;
//https://www.tabnine.com/code/java/classes/org.apache.spark.sql.DataFrameWriter
//https://spark.apache.org/docs/latest/sql-data-sources-csv.html


@Grab('org.apache.spark:spark-sql_2.13:3.3.0')

static String to_jsonld(Dataset df, LazyMap map) {
    def context = new JsonBuilder(map).toString()
    def result = df.toJSON().collect();
    def jsonld_string = '{ "@graph":  ' + result + ', "@context":' + context + '}'
    return jsonld_string
}
def string_split(x) {
    try {
        return x.split('\\|')
    } catch(Exception ex) {
        return x
    }
}
def expand_df_on_pipe(Dataset<Row> df) {
    for (String colname in df.columns()) {
        //df.col(col).show()
        Column column = df.col(colname)
        for (String str in column){
            List a = string_split(str)
        }
//        def df3 = df.select( df.col(colname))
//        df3.show()
//        people.select(when(col("gender").equalTo("male"), 0)
//                .when(col("gender").equalTo("female"), 1)
//                .otherwise(2))
        Dataset<Row> df2 = df.select(df.col(colname).split( "\\|")).as("NameArray").drop(colname);
        def df4 = split(df3, "\\|")
        //def df2 = df.select(split(col(col),"|").as("NameArray"))
        df = df.select(df.col(col), explode(df.col(col)))
        df.select(explode(split(col, "\\|"))).show
        df = df.withColumn(col, split(col, "\\|"));
        df = df.withColumn(col, explode(col));
    }
    return df.dropDuplicates();
}
def members_from_collection(df) {
    def collections = df.col('collection').isNotNull()
    collections.show(true)
    //= df.collection.dropna().unique()
    for (col in collections) {
        def medium = df.findAll { it.collection == col }.collect { [uri: it.uri, collection: it.collection] }
        medium_members = medium.uri.toList()
        def df2 = [type: 'skos:Collection', uri: col, member: medium_members]
        df = df + df2
    }
    return df
}
SparkSession spark = SparkSession
        .builder()
        .appName("Java Spark SQL basic example")
        .config("spark.master", "local")
        .getOrCreate();

String csv_file = "/home/gehau/git/codelijst-chemische_stof/src/main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/chemische_stof.csv";

File jsonld_file = new File("/tmp/test.jsonld")
File context_file = new File("/home/gehau/git/codelijst-chemische_stof/src/main/resources/be/vlaanderen/omgeving/data/id/conceptscheme/chemische_stof/context.json")

Dataset<Row> df = spark.read().option("header", "true").csv(csv_file);

def a = df.collect()
//df = members_from_collection(df)
//df.show();
expand_df_on_pipe(df).show();

LazyMap contextmap = new JsonSlurper().parse(context_file)

String jsonld = to_jsonld(df, contextmap)
jsonld_file.write(jsonld)

spark.stop()





//Dataset<Row> df2 = spark.read().option("delimiter", ";").csv(path);
//df2.show();




