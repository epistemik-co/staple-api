## Install Node.js

You need to ensure Node.js is installed. You can do that by executing the following command:

```bash
node -v
```

If no version is shown, please consult the download and installation instructions at [https://nodejs.org/](https://nodejs.org/).

## Install Staple API

Staple API is available as an [npm package](https://www.npmjs.com/package/staple-api) and can be installed with the following command:

```bash
npm i staple-api
```


## Ontology

The schema and resolvers of the GraphQL serivce inside Staple API are generated automatically based on the input [RDF ontology](/docs/?id=ontology-and-schema). The ontology should be defined in the [RDF Turtle sytnax](https://www.w3.org/TR/turtle/) and provided in a file. For instance, we can use the following ontology saved in a file `ontology.ttl`:

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


## Hello world!

```javascript
require staple-api 

let config = {
    ontology: "./ontology.ttl"
}
```

## Running as a server