const express = require("express");
const bodyParser = require("body-parser");
const uuidv1 = require("uuid/v1");
const jsonld = require("jsonld");
const { ApolloServer } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");
const logger = require("./config/winston");
const staple = require("staple-api");
const graphql = require('graphql')
const request = require('request')
// const DatabaseInterface = require("./database/database");
// const Resolver = require("./resolvers/resolvers");
// const createschema = require("./schema/gen-schema-staple/index");

async function main (){
    
}
const app = express();

const Warnings = []; // Warnings can be added as object to this array. Array is clear after each query.

app.use(bodyParser.json({ limit: "4000mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "4000mb", extended: true }));

// Cors
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    next();
});

app.listen({ port: 4000 }, () =>
    console.log("🚀 Server ready")
);

// show memory usage every 5 seconds
setInterval(function () {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    if (used > 100) {
        console.log("need to clear!");
    }
    return Math.round(used * 100) / 100;
}, 5000);

async function init(app, index) {
    let stapleApi = await staple("./ontology.ttl");
    let schema = stapleApi.schema;
    let database = stapleApi.database;
    // await loadExampleData(database);
    let server = new ApolloServer({
        schema,
        formatResponse: response => {
            if (response.errors !== undefined) {
                response.data = false;
            }
            else {
                if (response.data !== null && Warnings.length > 0) {
                    response["extensions"] = {};
                    response["extensions"]["Warning"] = [...Warnings];
                    Warnings.length = 0;
                }
            }
            return response;
        },
        context: () => {
            return {
                myID: index,
            };
        },
    });

    const path = "/graphql" + index;
    await insertExampleData("http://localhost:4000" + path)
    server.applyMiddleware({ app, path });

}

async function loadExampleData(database){
    let exampleObjects = require("./database/exampleObjects");
    for (let obj of exampleObjects) {
        let schMapping = require("./schema/schema-mapping");
        obj["@context"] = schMapping["@context"];
        const rdf = await jsonld.toRDF(obj, { format: "application/n-quads" });
        await database.insertRDF(rdf, obj._id);
    }
}
 
async function insertExampleData(endpoint){
    let exampleObjects = require("./database/exampleObjects");
    for (let obj of exampleObjects){
        let payload = {"query": "mutation " + obj._type[0] + "($input): Input" + obj._type[0], "variables": {"input": obj} }
        const res = awaitrequest.post({
            url: endpoint,
            // payload is the payload above
            data: payload,
          });
          console.log(res.statusCode)
    }
}
// async function customInit(app, index, req) {
//     // console.log(req.body.value)
//     let newEndpointData = await createschema(req.body.value);
//     // console.log(newEndpointData)
//     console.log(newEndpointData.schema)
//     // console.log(newEndpointData.context)

//     if (newEndpointData["Error"]) {
//         return newEndpointData;
//     }

//     // const database2 = new DatabaseInterface(newEndpointData.context);
//     // const rootResolver = new Resolver(database2, Warnings, newEndpointData.context, newEndpointData.schema).rootResolver; // Generate Resolvers for graphql
//     // let schema = makeExecutableSchema({
//     //     typeDefs: newEndpointData.schema,
//     //     resolvers: rootResolver,
//     // });
//     let exampleObjects = require("./database/exampleObjects");
//     let stapleApi = await staple("./ontology.ttl");
//     let schema = stapleApi.schema;
//     let database = stapleApi.database;
//     let server = new ApolloServer({
//         schema,
//         formatResponse: response => {
//             if (response.errors !== undefined) {
//                 response.data = false;
//             }
//             else {
//                 if (response.data !== null && Warnings.length > 0) {
//                     response["extensions"] = {};
//                     response["extensions"]["Warning"] = [...Warnings];
//                     Warnings.length = 0;
//                 }
//             }
//             return response;
//         },
//         context: () => {
//             return {
//                 myID: index,
//             };
//         },
//     });

//     const path = "/graphql" + index;
//     server.applyMiddleware({ app, path });
//     // console.log(newEndpointData.context)
//     return newEndpointData.context;
// }


app.get("/api/dynamic", function (req, res) {
    let id = uuidv1();
    init(app, id);
    res.send(id);
    logger.warn(`Endpoint created ! http://localhost:4000/graphql${id}`);
});
    

// app.post("/api/customInit", async function (req, res) {
//     let id = uuidv1();
//     let context = await customInit(app, id, req);

//     if (context["Error"]) {
//         res.status(500).send(context["Error"]);
//         logger.warn(`ERROR! Endpoint was not created ! ${context["Error"]} \n${req.body.value}`);
//     }
//     else {
//         res.send({ "id": id, "context": context });
//         logger.warn(`Endpoint created ! http://localhost:4000/graphql${id}`);
//     }

// });

// It will be used to pre create objects
// async function setDB() {
//     let exampleObjects = require("./database/exampleObjects");
//     let stapleApi = await staple("./ontology.ttl");
//     let schema = stapleApi.schema;
//     let database = stapleApi.database;
//     for (let obj of exampleObjects) {
//         let schMapping = require("./schema/schema-mapping");
//         obj["@context"] = schMapping["@context"];
//         const rdf = await jsonld.toRDF(obj, { format: "application/n-quads" });
//         console.log(rdf)
//         data
//         await database.insertRDFForPreloadedData(rdf, obj._id);
//     }
//     database.updateInference();
// }

// async function insertDB(){
    
// }

// setDB();

module.exports = {
    app,
};