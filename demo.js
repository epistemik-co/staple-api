const express = require('express');
const bodyParser = require('body-parser');
const jsonld = require('jsonld');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const DatabaseInterface = require('./database/Database');
const schemaString = require('./schema/schema2');
const Resolver = require('./resolvers/resolvers');

class Demo {
    constructor() {
        const database = new DatabaseInterface(require('./schema/schema-mapping2'));
        const Warnings = []; // Warnings can be added as object to this array. Array is clear after each query.
        const rootResolver = new Resolver(database, Warnings, require('./schema/schema-mapping2')).rootResolver; // Generate Resolvers for graphql
        const schema = makeExecutableSchema({
            typeDefs: schemaString,
            resolvers: rootResolver,
        });
        this.server = new ApolloServer({
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
    }

    run() {
        const app = express();
        app.use(bodyParser.json({ limit: '50mb', extended: true }))
        app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
        app.use(bodyParser.text({ limit: '50mb', extended: true }));

        this.server.applyMiddleware({ app });
        app.listen({ port: 4000 }, () =>
            console.log(`🚀 Server ready at http://localhost:4000${this.server.graphqlPath}`)
        );

        this.addEndPoints(app);

        this.app = app;
    }

    addEndPoints(app) {
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



        // This end-point should create data for qraphql mutation and run it.
        app.post('/api/uploadRDF', async (req, res) => {

            try {
                const todo = req.body;
                await database.insertRDF(todo);
                console.log(database.database.size)
                // console.log(await database.getFlatJson())
            } catch (error) {
                return res.status(500).send({
                    success: 'false',
                    message: error
                })
            }

            return res.status(201).send({
                success: 'true',
                message: 'added successfully'
            })
        });
    }
}

module.exports = Demo