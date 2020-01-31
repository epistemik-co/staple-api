const { makeExecutableSchema } = require("graphql-tools");
const DatabaseInterface = require("./database/database");
const Resolver = require("./resolvers/resolvers");

// configLocation - obiekt
class Staple {
    constructor(schemaLocation, contextLocation, configObject) { 
        this.schemaString = require(schemaLocation);
        this.schemaMapping = require(contextLocation);

        this.database = new DatabaseInterface(this.schemaMapping, configObject);

        this.Warnings = []; // Warnings can be added as object to this array. Array is clear after each query.
        this.rootResolver = new Resolver(this.database, this.Warnings, this.schemaMapping).rootResolver; // Generate Resolvers for graphql

        this.schema = makeExecutableSchema({
            typeDefs: this.schemaString,
            resolvers: this.rootResolver,
        });
        
    }  
}

module.exports = Staple;
