const express = require('express');
const bodyParser = require('body-parser');
const jsonld = require('jsonld');
const graphqlHttp = require('express-graphql');
const { makeExecutableSchema } = require('graphql-tools');

const DatabaseInterface = require('./database/Database');
const schemaString = require('./schema/schema');
const Resolver = require('./resolvers/resolvers');

const app = express();
const database = new DatabaseInterface();
const rootResolver = new Resolver(database).rootResolver;

app.use(bodyParser.json({ limit: '4000mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '4000mb', extended: true }))

function showMemUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    return Math.round(used * 100) / 100;
}

//initGraphQL server with makeExecutableSchema() which is the critical bit 
//istnieja pewnie inne sposoby inicjalizacji serwera i moze bedziemy szukac innych, ale ten dziala jak na chwilowe potrzeby ;)
const schema = makeExecutableSchema({
    typeDefs: schemaString,
    resolvers: rootResolver,


});


app.use('/graphql', graphqlHttp({
    schema: schema,
    graphiql: true,
    customFormatErrorFn: error => {
        const { code, message } = error.originalError;
        return { code, message };
    },
}));


app.get('/', async (req, res, next) => {
    res.send("HELLO WORLD!")
})


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


app.listen(3000);


module.exports = {
    app
};