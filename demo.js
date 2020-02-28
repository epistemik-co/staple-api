const express = require("express");
const bodyParser = require("body-parser");
const jsonld = require("jsonld");
const { ApolloServer } = require("apollo-server-express");
const uuidv1 = require("uuid/v1");
const logger = require("./config/winston");
const staple = require("./index");
// const appRoot = require("app-root-path");
 
async function Demo() {
    let stapleApi = await staple({string: `      @prefix dbo: <http://dbpedia.org/ontology/> .
    @prefix foaf: <http://xmlns.com/foaf/0.1/> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix owl: <http://www.w3.org/2002/07/owl#> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix dct: <http://purl.org/dc/terms/> .
    @prefix schema: <http://schema.org/> .
    # classes (-> GraphQL types )
    owl:Thing a rdfs:Class ;
        rdfs:comment "Anything" .
    dbo:Country a rdfs:Class ;
        rdfs:comment "A country" ;
        rdfs:subClassOf owl:Thing .
    dbo:Person a rdfs:Class ;
        rdfs:comment "A person" ;
        rdfs:subClassOf owl:Thing .
    # properties ( -> GraphQL fields )
    rdfs:label a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "Name of the entity" ;
        schema:domainIncludes owl:Thing ;
        schema:rangeIncludes xsd:string .
    dct:description a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "Description of an entity" ;
        schema:domainIncludes owl:Thing ;
        schema:rangeIncludes xsd:string .
    dct:empty a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "dummy property on Country" ;
        schema:domainIncludes dbo:Country ;
        schema:rangeIncludes xsd:string .
    dbo:thumbnail a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "Thumbnail URL" ;
        schema:domainIncludes owl:Thing ;
        schema:rangeIncludes xsd:string .
    dbo:birthYear a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "The year of birth" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes xsd:integer .
    dbo:deathYear a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "The year of death" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes xsd:integer .
    dbo:predecessor a rdf:Property ;
        rdfs:comment "A predecessor of a person in some formal role" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes dbo:Person .
    dbo:successor a rdf:Property ;
        rdfs:comment "A successor of a person in some formal role" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes dbo:Person .
    dbo:spouse a rdf:Property ;
        rdfs:comment "A spouse of a person" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes dbo:Person .
    dbo:child a rdf:Property ;
        rdfs:comment "A child of a person" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes dbo:Person .
    dbo:parent a rdf:Property ;
        rdfs:comment "A parent of a person" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes dbo:Person .
    dbo:birthCountry a rdf:Property ;
        rdfs:comment "The country of birth" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes dbo:Country .
    dbo:deathCountry a rdf:Property ;
        rdfs:comment "The country of death" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes dbo:Country .
    foaf:gender a rdf:Property, owl:FunctionalProperty ;
        rdfs:comment "Gender of a person" ;
        schema:domainIncludes dbo:Person ;
        schema:rangeIncludes xsd:string .`},
        {
            type: "sparql",
            url: "http://dbpedia.org/sparql", 
            updateUrl: "http://dbpedia.org/sparql",
            graphName: "http://dbpedia.org"
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