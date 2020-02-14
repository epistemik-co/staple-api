## Install Node.js

You need to ensure Node.js is installed. You can do that by executing the following command:

```bash
node -v
```

If no version is shown, please consult the installation instructions at [https://nodejs.org/](https://nodejs.org/).

## Install Yarn

You need to ensure Yarn is installed. You can do that by executing the following command:

```bash
yarn -v
```

If no version is shown, please consult the installation instructions at [https://classic.yarnpkg.com/en/docs/install](https://classic.yarnpkg.com/en/docs/install).


## Ontology

<!-- The schema and resolvers of the GraphQL serivce inside Staple API are generated automatically based on the input [RDF ontology](/docs/?id=ontology-and-schema). The ontology should be defined in the [RDF Turtle sytnax](https://www.w3.org/TR/turtle/) and provided in a file. For instance, we can use the following ontology saved in a file `ontology.ttl`: -->

Create `ontology.ttl` file:

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


## Hello world

Create `package.json` file:

```javascript
{
  "name": "staple-api-demo",
  "main": "demo.js",
  "dependencies": {
    "staple-api": "^1.0.5"
  },
  "resolutions": {
    "graphql": "^14.6.0"
  }
}
```


Create `demo.js` file:

```javascript
const { graphql } = require("graphql");
const staple = require("staple-api");

async function StapleDemo() {
    let stapleApi = await staple("./ontology.ttl");  

    graphql(stapleApi.schema, '{ _CONTEXT { _id _type } }', stapleApi.root).then((response) => {
        console.log(response);
      });
}

StapleDemo()
```

Install packages:
```bash
yarn
```

Run the demo:
```bash
node demo.js
```


## Run as server

Create `package.json` file:

```javascript
{
  "name": "staple-api-demo",
  "main": "demo.js",
  "dependencies": {
    "express": "^4.17.1",
    "express-graphql": "^0.9.0",
    "staple-api": "^1.0.5"
  },
  "resolutions": {
    "graphql": "^14.6.0"
  }
}
```

Create file `demo.js`:

```javascript
var express = require('express');
var graphqlHTTP = require('express-graphql');
const staple = require("staple-api");


async function StapleDemo() {
    let stapleApi = await staple("./ontology.ttl");

    var app = express();
    app.use('/graphql', graphqlHTTP({
        schema: stapleApi.schema,
        rootValue: stapleApi.root,
        graphiql: true,
    }));
    
    app.listen(4000);
    console.log('Running a GraphQL API server at localhost:4000/graphql');
}

StapleDemo()
```

Install packages:
```bash
yarn
```

Run the demo:
```bash
node demo.js
```

## Run with MongoDB config

[Install and run MongoDB](https://docs.mongodb.com/manual/installation/).

Create `package.json` file:

```javascript
{
  "name": "staple-api-demo",
  "main": "demo.js",
  "dependencies": {
    "express": "^4.17.1",
    "express-graphql": "^0.9.0",
    "staple-api": "^1.0.5"
  },
  "resolutions": {
    "graphql": "^14.6.0"
  }
}
```

Create file `demo.js`:

```javascript
var express = require('express');
var graphqlHTTP = require('express-graphql');
const staple = require("staple-api");

let credentials = {
    type: "mongodb",
    url: "mongodb://127.0.0.1:27017", 
    dbName: "staple",
    collectionName: "demoCollection",
};

async function StapleDemo() {
    let stapleApi = await staple("./ontology.ttl", credentials);

    var app = express();
    app.use('/graphql', graphqlHTTP({
        schema: stapleApi.schema,
        rootValue: stapleApi.root,
        graphiql: true,
    }));
    
    app.listen(4000);
    console.log('Running a GraphQL API server at localhost:4000/graphql');

}

StapleDemo()
```

Install packages:
```bash
yarn
```

Run the demo:
```bash
node demo.js
```