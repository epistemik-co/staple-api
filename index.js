const express = require("express");
const bodyParser = require("body-parser");
const uuidv1 = require("uuid/v1");
const jsonld = require("jsonld");
const { ApolloServer } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");
const logger = require("./config/winston");

let exampleObjects = require("./database/exampleObjects");

const DatabaseInterface = require("./database/database");
const Resolver = require("./resolvers/resolvers");
const createschema = require("./schema/gen-schema-staple/index");

const app = express();

const database = new DatabaseInterface(require("./schema/schema-mapping"));
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
    const database2 = new DatabaseInterface(require("./schema/schema-mapping"));

    const schemaString = require("./schema/schema");
    // load data
    database2.database = database.dbCopy();
    const rootResolver = new Resolver(database2, Warnings, require("./schema/schema-mapping")).rootResolver; // Generate Resolvers for graphql
    let schema = makeExecutableSchema({
        typeDefs: schemaString,
        resolvers: rootResolver,
    });
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
    server.applyMiddleware({ app, path });
}
 
async function customInit(app, index, req) {
    // console.log(req.body.value)
    let newEndpointData = await createschema(req.body.value);
    // console.log(newEndpointData)
    // console.log(newEndpointData.schema)
    // console.log(newEndpointData.context)

    if (newEndpointData["Error"]) {
        return newEndpointData;
    }

    const database2 = new DatabaseInterface(newEndpointData.context);
    const rootResolver = new Resolver(database2, Warnings, newEndpointData.context, newEndpointData.schema).rootResolver; // Generate Resolvers for graphql
    let schema = makeExecutableSchema({
        typeDefs: newEndpointData.schema,
        resolvers: rootResolver,
    });
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
    server.applyMiddleware({ app, path });
    // console.log(newEndpointData.context)
    return newEndpointData.context;
}


app.get("/api/dynamic", function (req, res) {
    let id = uuidv1();
    init(app, id);
    res.send(id);
    logger.warn(`Endpoint created ! http://localhost:4000/graphql${id}`);
});
    

app.post("/api/customInit", async function (req, res) {
    let id = uuidv1();
    let context = await customInit(app, id, req);

    if (context["Error"]) {
        res.status(500).send(context["Error"]);
        logger.warn(`ERROR! Endpoint was not created ! ${context["Error"]} \n${req.body.value}`);
    }
    else {
        res.send({ "id": id, "context": context });
        logger.warn(`Endpoint created ! http://localhost:4000/graphql${id}`);
    }

});

// It will be used to pre create objects
async function setDB() {
    for (let obj of exampleObjects) {
        let schMapping = require("./schema/schema-mapping");
        obj["@context"] = schMapping["@context"];
        const rdf = await jsonld.toRDF(obj, { format: "application/n-quads" });
        await database.insertRDFForPreloadedData(rdf, obj._id);
    }
    database.updateInference();
}
setDB();

module.exports = {
    app,
};