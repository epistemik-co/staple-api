const express = require('express');
const bodyParser = require('body-parser');
const jsonld = require('jsonld');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');

const DatabaseInterface = require('./database/Database');
const schemaString = require('./schema/schema');
const Resolver = require('./resolvers/resolvers');

const app = express();
const database = new DatabaseInterface(require('./schema/schema-mapping'));

const Warnings = []; // Warnings can be added as object to this array. Array is clear after each query.
const rootResolver = new Resolver(database, Warnings, require('./schema/schema-mapping')).rootResolver; // Generate Resolvers for graphql

app.use(bodyParser.json({ limit: '4000mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '4000mb', extended: true }))

function showMemUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    return Math.round(used * 100) / 100;
}

// init GraphQL server with makeExecutableSchema() which is the critical bit 
const schema = makeExecutableSchema({
    typeDefs: schemaString,
    resolvers: rootResolver,
});

// Graphql ApolloSerwer init
const server = new ApolloServer({
    schema,
    formatResponse: response => {
        if (response.errors !== undefined) {
            response.data = false;
        }
        else {
            if (response.data !== null && Warnings.length > 0) {
                response["extensions"] = {}
                response["extensions"]['Warning'] = [...Warnings];
                Warnings.length = 0;
            }
        }
        return response;
    },
});

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);


app.get('/', async (req, res, next) => {
    res.send("HELLO WORLD!")
})

// This end-point should create data for qraphql mutation and run it.
app.post('/api/upload', async (req, res) => { 
    var start = new Date().getTime();
    try {
        const todo = req.body;
        const rdf = await jsonld.toRDF(todo, { format: 'application/n-quads' });
        console.log(rdf)
        database.insertRDF(rdf);

    } catch (error) {
        return res.status(500).send({
            success: 'false',
            message: error
        })
    }

    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time on local of data loading: ' + time / 1000 + ' s.');

    return res.status(201).send({
        success: 'true',
        message: 'added successfully'
    })
});

class Staple {
    constructor(schemaLocation, contextLocation, configLocation){
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
        console.log("WORKIBNG ?")
    }
}

const test = new Staple('./schema/schema', './schema/schema-mapping', "");

module.exports = {
    app,
    Staple
};