const { makeExecutableSchema } = require("graphql-tools");
const DatabaseInterface = require("./database/database");
const Resolver = require("./resolvers/resolvers");
const schemaFromOntology = require("./schema/schemaFromOntology");
const jsonldFromOntology = require("./schema/jsonldFromOntology");
const { printSchema, graphql } = require("graphql");

async function init(ontology, configObject){
    let schemaObj = {};
    let schema = await schemaFromOntology.generateSchema(ontology);
    schemaObj.schemaSDL =  printSchema(schema);
    schemaObj.schemaMapping = await jsonldFromOntology.process(ontology);
    schemaObj.context = schemaObj.schemaMapping["@context"];
    schemaObj.database = new DatabaseInterface(schemaObj.schemaMapping, configObject);

    schemaObj.Warnings = []; // Warnings can be added as object to schemaObj array. Array is clear after each query.
    schemaObj.rootResolver = new Resolver(schemaObj.database, schemaObj.Warnings, schemaObj.schemaMapping, schemaObj.schemaSDL).rootResolver; // Generate Resolvers for graphql
 
    schemaObj.schema = makeExecutableSchema({
        typeDefs: schemaObj.schemaSDL,
        resolvers: schemaObj.rootResolver,
    });

    schemaObj.graphql = async (query) => graphql(schemaObj.schema, query)

    return schemaObj;
}


module.exports = init;
