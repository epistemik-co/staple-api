const { makeExecutableSchema } = require('graphql-tools');
const { graphql } = require('graphql');
const Demo = require('./demo')

let demo = new Demo();
demo.run()

class Staple {
    constructor(schemaLocation, contextLocation, configLocation) {
        this.DatabaseInterface = require('./database/Database');
        this.schemaString = require(schemaLocation);//('./schema/schema');
        this.schemaMapping = require(contextLocation);//('schema/schema-mapping');
        this.Resolver = require('./resolvers/resolvers');

        this.database = new DatabaseInterface(this.schemaMapping);

        this.Warnings = []; // Warnings can be added as object to this array. Array is clear after each query.
        this.rootResolver = new Resolver(this.database, this.Warnings, this.schemaMapping).rootResolver; // Generate Resolvers for graphql

        this.schema = makeExecutableSchema({
            typeDefs: this.schemaString,
            resolvers: this.rootResolver,
        });
    }

    async processQuery(query) {
        let result = await graphql(this.schema, query, null, null, null);
        return result;
    }
}

function showMemUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    return Math.round(used * 100) / 100;
}

// setInterval(showMemUsage, 1000); //time is in ms



module.exports = {
    Staple
};