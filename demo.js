const express = require("express");
const bodyParser = require("body-parser");
const jsonld = require("jsonld");
const { ApolloServer } = require("apollo-server-express");
const uuidv1 = require("uuid/v1");
const logger = require("./config/winston");
const staple = require("./index");
const appRoot = require("app-root-path");

async function Demo() {
    let demo = {};
    let stapleApi = await staple("./schema/test.ttl", require(appRoot + "/config/database.js"));
    demo.database = stapleApi.database;
    let schema = stapleApi.schema;
    demo.server = new ApolloServer({
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

    run(demo);
}

function run(demo) {
    const app = express();
    app.use(bodyParser.json({ limit: "50mb", extended: true }));
    app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
    app.use(bodyParser.text({ limit: "50mb", extended: true }));

    demo.server.applyMiddleware({ app });
    app.listen({ port: 4000 }, () =>
        logger.log("info", `🚀 Server ready at http://localhost:4000${demo.server.graphqlPath}`)
    );

    addEndPoints(app, demo);

    demo.app = app;
}

function addEndPoints(app, demo) {
    app.post("/api/upload", async (req, res) => {
        try {
            const todo = req.body;
            const rdf = await jsonld.toRDF(todo, { format: "application/n-quads" });
            logger.silly(rdf);
            demo.database.insertRDF(rdf);

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
            demo.database.drop();
            logger.info("Recived RDF");
            const todo = req.body;
            let uuid = uuidv1();
            logger.info(`UUID FOR NEW RDF ${uuid}`);
            await demo.database.insertRDF(todo, true, uuid);
            logger.info(`Database size: ${demo.database.database.size}`);
            demo.database.countObjects();
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



Demo();

module.exports = Demo;