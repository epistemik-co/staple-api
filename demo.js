const express = require('express');
const bodyParser = require('body-parser');
const jsonld = require('jsonld');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const DatabaseInterface = require('./database/Database');
const schemaString = require('./schema/schema');
const Resolver = require('./resolvers/resolvers');
const uuidv1 = require('uuid/v1');
var morgan = require('morgan');
const logger = require('./config/winston');
const util = require('util')

class Demo {
    constructor() {
        this.database = new DatabaseInterface(require('./schema/schema-mapping'));
        const Warnings = []; // Warnings can be added as object to this array. Array is clear after each query.
        const rootResolver = new Resolver(this.database, Warnings, require('./schema/schema-mapping')).rootResolver; // Generate Resolvers for graphql
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
        logger.info("Endpoint is ready")
    }

    run() {
        const app = express();
        app.use(bodyParser.json({ limit: '50mb', extended: true }))
        app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
        app.use(bodyParser.text({ limit: '50mb', extended: true }));
        //app.use(morgan('combined', { stream: winston.stream }));


        // winston.log('silly', "127.0.0.1 - there's no place like home");
        // winston.log('debug', "127.0.0.1 - there's no place like home");
        // winston.log('info', "127.0.0.1 - there's no place like home");

        this.server.applyMiddleware({ app });
        app.listen({ port: 4000 }, () =>
            logger.log('info', `🚀 Server ready at http://localhost:4000${this.server.graphqlPath}`)
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
                logger.silly(rdf)
                this.database.insertRDF(rdf);

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

        // This end-point should create data for qraphql mutation and run it.
        app.post('/api/uploadRDF', async (req, res) => {
            try {
                this.database.drop();
                logger.info("Recived RDF")
                const todo = req.body;
                let uuid = uuidv1();
                logger.info(`UUID FOR NEW RDF ${uuid}`)
                await this.database.insertRDF(todo, undefined, true, uuid);
                logger.info(`Database size: ${this.database.database.size}`)
                logger.info(await this.database.getFlatJson())
                this.database.countObjects()
            } catch (error) {
                logger.error(error)
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