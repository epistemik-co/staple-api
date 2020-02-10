## Install Node.js

You need to ensure Node.js is installed on your machine. You can do it by executing the following command:

```bash
node -v
```

If no version is printed as result please consult the installation guide at [https://nodejs.org/](https://nodejs.org/) to install the recent version of Node.js.

## Install Staple API

```bash
npm i staple-api
```


## Provide an ontology file


For instance, create a text file called `ontology.ttl` containing the following specification:

```turtle
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

schema:Agent a rdfs:Class ;
    rdfs:comment "An agent" .

schema:Organization a rdfs:Class ;
    rdfs:comment "An organization such as a school, NGO, corporation, club, etc." ;
    rdfs:subClassOf schema:Agent .

schema:Person a rdfs:Class ;
    rdfs:comment "A person" ;
    rdfs:subClassOf schema:Agent .

schema:name a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "Name of the agent" ;
    schema:domainIncludes schema:Agent ;
    schema:rangeIncludes xsd:string ;

schema:age a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "Age of the person" ;
    schema:domainIncludes schema:Person ;
    schema:rangeIncludes xsd:integer ;

schema:isMarried a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "The person is married." ;
    schema:domainIncludes schema:Person ;
    schema:rangeIncludes xsd:boolean ;

schema:revenue a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "The annual revenue of the organization." ;
    schema:domainIncludes schema:Organization ;
    schema:rangeIncludes xsd:decimal ;

schema:employee a rdf:Property ;
    rdfs:comment "An employee of an organization." ;
    schema:domainIncludes schema:Organization ;
    schema:rangeIncludes schema:Person .
```


## Provide a configuration file

For the first test with an in-memory graph database, the following JSON saved in a file called `config.json` is sufficient:

```javascript
{
    "ontology": "./ontology.ttl"
}
```

## Start the API

```bash
npm start run
```

