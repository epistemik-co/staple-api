const express = require('express');
const bodyParser = require('body-parser');
const jsonld = require('jsonld');
const graphqlHttp = require('express-graphql');
const { makeExecutableSchema } = require('graphql-tools');
const read = require('graphy').content.nt.read;
const dataset_tree = require('graphy').util.dataset.tree
const factory = require('@graphy/core.data.factory');

const app = express();

app.use(bodyParser.json({limit: '4000mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '4000mb', extended: true}))

function showMemUsage(){
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    return Math.round(used * 100) / 100;
}

let y_tree = dataset_tree();

async function getObjs(sub, pred) {
    // showMemUsage()
    const temp = y_tree.match(factory.namedNode( sub ) ,factory.namedNode( pred ) , null);
    data = [];
    var itr = temp.quads();
    var x = itr.next();
    while(!x.done){
        data.push(x.value.object.value);
        x = itr.next();
    }
    return data;
};

async function getSingleStringValue(sub, pred) {
    // showMemUsage()
    const temp = y_tree.match(factory.namedNode( sub ) ,factory.namedNode( pred ) , null);
    data = [];
    var itr = temp.quads();
    var x = itr.next();
    return x.value.object.value;
};


async function getSubs(type) {
    // showMemUsage()
    const predicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"

    const temp = y_tree.match(null,factory.namedNode( predicate ) , factory.namedNode( type ));

    data = [];
    var itr = temp.quads();
    var x = itr.next();
    while(!x.done){
        data.push(x.value.subject.value);
        x = itr.next();
    }
    return data;
};

// resolvers
var rootResolver = {
    Query: {
        Person_GET: () =>{
            return getSubs("http://schema.org/Person");
        },
        Organization_GET: () =>{
            return getSubs("http://schema.org/Organization");
        }
    },
    Person: {
        _id: (parent) => {return parent},
        name: (parent) => { return getSingleStringValue(parent, "http://schema.org/name") },
        affiliation: (parent) => { return getObjs(parent, "http://schema.org/affiliation") }
        },
    Organization: {
        _id: (parent) => {return parent},
        legalName: (parent) => { return getSingleStringValue(parent, "http://schema.org/legalName") },
        employee: (parent) => { return getObjs(parent, "http://schema.org/employee") }
        }
    }


// schema
schemaString = `
        type Query {
            Person_GET: [Person]
            Organization_GET: [Organization]
        }
        type Organization {
            _id: ID!
            legalName: String
            employee: [Person]
        }
        type Person {
            _id: ID!
            name: String
            affiliation: [Organization]
        }
        `

//initGraphQL server with makeExecutableSchema() which is the critical bit 
//istnieja pewnie inne sposoby inicjalizacji serwera i moze bedziemy szukac innych, ale ten dziala jak na chwilowe potrzeby ;)
const schema = makeExecutableSchema({
  typeDefs:schemaString,
  resolvers:rootResolver,
});

app.use('/graphql', graphqlHttp({
    schema: schema,
    graphiql: true,
}));


app.get('/', async (req,res,next) => {
    res.send("HELLO WORLD!")
})


app.post('/api/upload',async (req, res) => {
    var start = new Date().getTime();
    try {
        const todo = req.body;
        const rdf = await jsonld.toRDF(todo, {format: 'application/n-quads'});
        await read(rdf, {
            data(y_quad) {
                y_tree.add(y_quad)
            },
            eof(h_prefixes) {
                
            },
        })
    } catch (error) {
        return res.status(500).send({
            success: 'false',
            message:  error
        })
    }

    var end = new Date().getTime();
    var time = end - start;
    console.log('Execution time on local of data loading: ' + time/1000 + ' s.');

    return res.status(201).send({
        success: 'true',
        message: 'added successfully'
    })
});

app.listen(3000);

module.exports = {
    app
};