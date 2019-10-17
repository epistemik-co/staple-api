const express = require('express');
const bodyParser = require('body-parser');
const uuidv1 = require('uuid/v1');
const jsonld = require('jsonld');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const { graphql } = require('graphql');

let schMapping = require('./schema/schema-mapping')
let objects = require('./database/exampleObjects')

const DatabaseInterface = require('./database/Database');
const schemaString = require('./schema/schema');
const Resolver = require('./resolvers/resolvers');

const app = express(); 

const database = new DatabaseInterface(require('./schema/schema-mapping'));
const Warnings = []; // Warnings can be added as object to this array. Array is clear after each query.

app.use(bodyParser.json({ limit: '4000mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '4000mb', extended: true }))

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready`)
);

async function init(app, index) {
    const database2 = new DatabaseInterface(require('./schema/schema-mapping'));
    // load data
    database2.database = database.dbCopy()
    const rootResolver = new Resolver(database2, Warnings, require('./schema/schema-mapping')).rootResolver; // Generate Resolvers for graphql
    schema = makeExecutableSchema({
        typeDefs: schemaString,
        resolvers: rootResolver,
    });
    server = new ApolloServer({
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
        } 
    });
 

const path = '/graphql' + index;
server.applyMiddleware({ app, path });
 
}

app.get('/api/dynamic', function (req, res) {
    let id = uuidv1();
    init(app, id);
    res.send(id)
});

setInterval(function(){
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    if(used > 100){
        console.log("need to clear!") 
    }
    return Math.round(used * 100) / 100;
  }, 5000);


async function setDB(){
    for(let obj of objects){
        obj["@context"] = schMapping["@context"];
        const rdf = await jsonld.toRDF(obj, { format: 'application/n-quads' }); 
        await database.insertRDF(rdf, obj._id);
    }
}

setDB();

module.exports = {
    app,
};