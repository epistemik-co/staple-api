## Playground

Try querying our [live playground](http://playground.staple-api.org) first, for instance with:  

```
{
  _CONTEXT {
      _id
      _type
      Person
      Organization
      name
      age
      isMarried
      customerOf
      revenue
      employee
  }
  Person {
    _id
    _type
    name
    age
    isMarried
    customerOf {
      _id
      _type
      name
      revenue
      employee {
        _id
      }
    }
  }
}
```


You can also start the dafault [playground on Repl](/tutorial/?id=playground-on-repl).


## Running Staple API

Staple API is built in Node.js. You can ensure Node.js is installed by executing the following command:

```bash
node -v
```

If no version is shown, please consult the installation instructions at [https://nodejs.org/](https://nodejs.org/).

The schema and resolvers of the GraphQL serivce inside Staple API are generated automatically based on the input [RDF ontology](/docs/?id=ontology-and-schema). The ontology should be defined in the [RDF Turtle sytnax](https://www.w3.org/TR/turtle/) and provided in a file path or as a string. Create a sample `ontology.ttl` file in the project:

```turtle
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix example: <http://example.com#> .

# classes (-> GraphQL types )

example:Organization a rdfs:Class ;
    rdfs:comment "An organization such as a school, NGO, corporation, club, etc." .

example:Person a rdfs:Class ;
    rdfs:comment "A person" .

# properties ( -> GraphQL fields )

example:name a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "Name" ;
    schema:domainIncludes example:Person ;
    schema:domainIncludes example:Organization ;
    schema:rangeIncludes xsd:string .

example:employee a rdf:Property ;
    rdfs:comment "An employee of an organization" ;
    schema:domainIncludes example:Organization ;
    schema:rangeIncludes example:Person .
```

### Query the API

Install packages:

```bash
npm i staple-api
```

Create `demo.js` file:

```javascript
const staple = require("staple-api");

let ontology = {
  file: "./ontology.ttl"
  }

async function StapleDemo() {
    let stapleApi = await staple(ontology);  

    stapleApi.graphql('{ _CONTEXT { _id _type Person employee } }').then((response) => {
        console.log(JSON.stringify(response))
        });
}

StapleDemo()
```

Run the demo:
```bash
node demo.js
```


### Run as server

Install packages:

```bash
npm i staple-api express express-graphql
```

Create file `demo.js`:

```javascript
var express = require('express');
var graphqlHTTP = require('express-graphql');
const staple = require("staple-api");

let ontology = {
  file: "./ontology.ttl"
  }

async function StapleDemo() {
    let stapleApi = await staple(ontology);

    var app = express();
    app.use('/graphql', graphqlHTTP({
        schema: stapleApi.schema,
        graphiql: true
    }));
    
    app.listen(4000);
    console.log('Running a GraphQL API server at localhost:4000/graphql');
}

StapleDemo()
```

Run the demo:
```bash
node demo.js
```

### Run with MongoDB

[Install and run MongoDB](https://docs.mongodb.com/manual/installation/) locally as a standalone on the default port `27017`. Create a database `staple` and with a new collection `staple`.

Install packages:

```bash
npm i staple-api express express-graphql
```

Create file `demo.js`:

```javascript
var express = require('express');
var graphqlHTTP = require('express-graphql');
const staple = require("staple-api");

let ontology = {
  file: "./ontology.ttl"
  }

let config = {
    type: "mongodb",
    url: "mongodb://127.0.0.1:27017", 
    dbName: "staple",
    collectionName: "staple",
};

async function StapleDemo() {
    let stapleApi = await staple(ontology, config);

    var app = express();
    app.use('/graphql', graphqlHTTP({
        schema: stapleApi.schema,
        graphiql: true
    }));
    
    app.listen(4000);
    console.log('Running a GraphQL API server at localhost:4000/graphql');
}

StapleDemo()
```

Run the demo:
```bash
node demo.js
```

### Convert results to RDF

By applying JSON-LD context, assumed by every instance of Staple API, the response of each query can be stragihtforwardly rendered as RDF, which provides a disambiguated and graph-based view of the same data.

Install packages:

```bash
npm i staple-api express express-graphql
```

Create file `demo.js`:


```javascript 
const staple = require("staple-api");
const jsonld = require("jsonld")

let ontology = {
  file: "./ontology.ttl"
  }

async function StapleDemo() {
    let stapleApi = await staple(ontology);  
    let context = stapleApi.context
    let data = {}

    await stapleApi.graphql('mutation { Person(input: { _id: "http://example.com/john" name: "John Smith" } ) }').then((response) => {
      });

    await stapleApi.graphql('{ Person { _id name } }').then((response) => {
        data = response.data
      });

      data["@context"] = context
      data["@id"] = "@graph"

      let rdf = await jsonld.toRDF(data, { format: "application/n-quads" });
      console.log("JSON-LD:")
      console.log(JSON.stringify(data))
      console.log("\nRDF:")
      console.log(rdf)
}

StapleDemo()
```

Run the demo:
```bash
node demo.js
```


## Playground on Repl

The default setup of the [Staple API playground](http://playground.staple-api.org/) can also be run from code on [Repl](https://repl.it/). Go to [Repl](https://repl.it/) and create a new Repl sandbox for Node.js. Then paste and run the following code:

```javascript
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const staple = require("staple-api");

const ontology = {
    string: `
        @prefix schema: <http://schema.org/> .
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
            schema:rangeIncludes example:Organization .
    `
    }
  
async function StapleDemo() {
    const app = express();
    const stapleApi = await staple(ontology);
    const schema = stapleApi.schema

    stapleApi.graphql(`mutation { Person(input: { _id: "http://example.com/john" name: "John Smith" age: 35 isMarried: true customerOf: [ "http://example.com/bank" "http://example.com/mobile" ]})}`)
    stapleApi.graphql(`mutation { Person(input: { _id: "http://example.com/mark" name: "Mark Brown" age: 40 isMarried: false customerOf: [ "http://example.com/bank" ]})}`)
    stapleApi.graphql(`mutation { Organization(input: { _id: "http://example.com/bank" name: "National Bank" revenue: 12.5 employee: [ "http://example.com/john" ]})}`)
    stapleApi.graphql(`mutation { Organization(input: { _id: "http://example.com/mobile" name: "Mobile Network Provider" revenue: 10 employee: [ "http://example.com/mark" ]})}`)

    const path = "/"
    const server = new ApolloServer({
        schema
    });

    app.listen({ port: 8080 }, () =>
        console.log("🚀 Server ready")
    );

    server.applyMiddleware({ app, path });
}

StapleDemo()
```