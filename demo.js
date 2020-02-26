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
        string: `@prefix schema: <http://schema.org/> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix owl: <http://www.w3.org/2002/07/owl#> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix example: <http://example.com/> .
    # classes (-> GraphQL types )
    example:Agent a rdfs:Class ;
        rdfs:comment "An agent (individual or legal)" .
    example:Organization a rdfs:Class ;
        rdfs:comment "An organization such as a school, NGO, corporation, club, etc." ;
        rdfs:subClassOf example:Agent .
    example:Person a rdfs:Class ;
        rdfs:comment "A person" ;
        rdfs:subClassOf example:Agent .
    # properties ( -> GraphQL fields )
    example:name a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "Name of the agent" ;
        schema:domainIncludes example:Agent ;
        schema:rangeIncludes xsd:string .
    example:age a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "Age of the person" ;
        schema:domainIncludes example:Person ;
        schema:rangeIncludes xsd:integer .
    example:isMarried a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "This person is married" ;
        schema:domainIncludes example:Person ;
        schema:rangeIncludes xsd:boolean .
    example:revenue a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "The annual revenue of the organization" ;
        schema:domainIncludes example:Organization ;
        schema:rangeIncludes xsd:decimal .
    example:employee a rdf:Property ;
        rdfs:comment "An employee of an organization" ;
        schema:domainIncludes example:Organization ;
        schema:rangeIncludes example:Person .
    example:customerOf a rdf:Property ;
        rdfs:comment "An organization this agent is a customer of" ;
        schema:domainIncludes example:Agent ;
        schema:rangeIncludes example:Organization .`},
        // {
        //     type: "sparql",
        //     url: "http://localhost:3030/staple/sparql", 
        //     updateUrl: "http://localhost:3030/staple/update",
        //     // graphName: "http://example.com/test"
        // }
        {
            dataSources: {
                mongodb: {
                    type: "mongodb",
                    url: "mongodb://127.0.0.1:27017",
                    dbName: "staple",
                    collectionName: "quads3",
                }
            }
        }
    );//, require(appRoot + "/config/database.js"));
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