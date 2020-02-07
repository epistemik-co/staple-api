const express = require("express");
const bodyParser = require("body-parser");
const jsonld = require("jsonld");
const { ApolloServer } = require("apollo-server-express"); 
const uuidv1 = require("uuid/v1"); 
const logger = require("./config/winston"); 
const staple = require("./index");
const appRoot = require("app-root-path");
const util = require("util");
const mongodbAddOrUpdate = require("./database/database utilities/backends/mongodb/Utilities");

class Demo {
    constructor() {
        let stapleApi = new staple("./schema/schema", "./schema/schema-mapping" , require(appRoot+"/config/database.js"));
        this.database = stapleApi.database;
        let schema = stapleApi.schema;
        this.server = new ApolloServer({
            schema,
            formatResponse: response => {
                if (response.errors !== undefined) {
                    response.data = false;
                }
                else {
                    if (response.data !== null && stapleApi.Warnings.length > 0) {
                        response["extensions"] = {};
                        response["extensions"]["Warning"] = [...stapleApi.Warnings];
                        stapleApi.Warnings.length = 0;
                    }
                }
                return response;
            },
        });
        logger.info("Endpoint is ready");
    }

    run() {
        const app = express();
        app.use(bodyParser.json({ limit: "50mb", extended: true }));
        app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
        app.use(bodyParser.text({ limit: "50mb", extended: true })); 

        this.server.applyMiddleware({ app });
        app.listen({ port: 4000 }, () =>
            logger.log("info", `🚀 Server ready at http://localhost:4000${this.server.graphqlPath}`)
        );

        this.addEndPoints(app);

        this.app = app;
    }

    addEndPoints(app) {
        app.post("/api/upload", async (req, res) => { 
            try {
                const todo = req.body;
                const rdf = await jsonld.toRDF(todo, { format: "application/n-quads" });
                logger.silly(rdf);
                this.database.insertRDF(rdf);

            } catch (error) {
                return res.status(500).send({
                    success: "false",
                    message: error
                });
            }

            return res.status(201).send({
                success: "true",
                message: "added successfully"
            });
        });

        // This end-point should create data for qraphql mutation and run it.
        // does not work
        app.post("/api/uploadRDF", async (req, res) => {
            try {
                this.database.drop();
                logger.info("Recived RDF");
                const todo = req.body;
                let uuid = uuidv1();
                logger.info(`UUID FOR NEW RDF ${uuid}`);
                await this.database.insertRDF(todo, true, uuid);
                logger.info(`Database size: ${this.database.database.size}`);
                logger.info(await this.database.getFlatJson());
                console.log(util.inspect(this.database.flatJsons, false, null, true) );
                console.log(JSON.stringify(this.database.flatJsons));
                this.database.countObjects();
                mongodbAddOrUpdate.mongodbAddOrUpdate(this.database.flatJsons);
            } catch (error) {
                logger.error(error);
                return res.status(500).send({
                    success: "false",
                    message: error
                });
            }

            return res.status(201).send({
                success: "true",
                message: "added successfully"
            });
        });
    }
}


let demo = new Demo();
demo.run();

module.exports = Demo;