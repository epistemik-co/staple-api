const express = require("express");
const bodyParser = require("body-parser");
const jsonld = require("jsonld");
const { ApolloServer } = require("apollo-server-express");
const uuidv1 = require("uuid/v1");
const logger = require("./config/winston");
const staple = require("./index");
// const appRoot = require("app-root-path");

async function Demo() {
    let stapleApi = await staple({
        string: `@prefix dbo: <http://dbpedia.org/ontology/> .
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
        @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
        @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
        @prefix owl: <http://www.w3.org/2002/07/owl#> .
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
        @prefix dct: <http://purl.org/dc/terms/> .
        @prefix schema: <http://schema.org/> .

        owl:Thing a rdfs:Class ;
            rdfs:comment "Anything" .

        dbo:Country a rdfs:Class ;
            rdfs:comment "A country" ;
            rdfs:subClassOf owl:Thing .

        rdfs:label a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "Name of the entity" ;
        schema:domainIncludes owl:Thing ;
        schema:rangeIncludes xsd:string .`},
        {
            type: "mongodb",
            url: "mongodb://127.0.0.1:27017",
            dbName: "staple",
            collectionName: "quads3",
        }
    );
    let demo = {};
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
}

Demo();

module.exports = Demo;