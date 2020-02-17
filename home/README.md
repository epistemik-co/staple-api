## What is it?

**Staple API** is a lightweight GraphQL-based API for an easy management of **knowledge graphs**, modeled and virtualized as linked data and structured by an RDF ontology. 

A **knowledge graph** is an abstraction of data that views it as a collection of entities (represented as _graph nodes_) connected with relationships (represented as _graph edges_) whose meaning and structure is described via a consistent set of semantic rules and constraints. 


## What is it good for?

Modern knowledge graph-based applications very often need to replicate their data across different databases in order to support diverse functionalities, e.g.: 
1. a document store for simple management of all data objects
2. a graph database for analytical insights into complex relationships between them
3. a search engine for efficient search and retrieval purposes

While data in such architectures constitutes pieces of the same knowledge graph it is difficult to manage it as such, leading to increasing problems with its uniform structuring and synchronisation across the storages. 

**Staple API** is a flexible **data abstraction middleware**, which separates data storage back-ends from your application to allow uniform view and access to data **as consistent fragments of the same knowledge graph** via a standard GraphQL interface, irrespective of the actual storage type. 

<br>

<p align="center">
  <img src="staple-api-architecture1.png">
</p>


## Key features

:heavy_check_mark: Automatic generation of GraphQL schema from an RDF ontology.

:heavy_check_mark: Automatic generation of resolvers for a default set of queries and mutations.

:heavy_check_mark: JSON-LD context included to support immediate JSON-to/from-graph conversions.

:heavy_check_mark: Basic type inheritance / inference supported.

:heavy_check_mark: A connector to a MongoDB storage (other back-ends coming soon!).

:heavy_check_mark: An in-memory graph database for rapid testing and prototyping.

<br>

<p align="center">
  <img src="staple-api-architecture2.png">
</p>



<!-- 
!> **Note**: *This project is at very early stages of development* -->


## Playground

?> A live playground is available at: [http://playground.staple-api.org](http://playground.staple-api.org).


## GitHub

?> The GitHub repository is available at: [https://github.com/epistemik-co/staple-api](https://github.com/epistemik-co/staple-api).

## NPM

?> The API is available as an NPM package from: [https://github.com/epistemik-co/staple-api](https://www.npmjs.com/package/staple-api).

## License

?> This software has been created by [EPISTEMIK](http://epistemik.co) and is available under the [MIT license](https://github.com/epistemik-co/staple-api/blob/master/LICENSE).

## Technology stack

* [GraphQL](https://graphql.org/)
* [JSON-LD](https://json-ld.org)
* [schema.org](http://schema.org)
* [graphy.js](https://graphy.link/)
* [MongoDB](https://www.mongodb.com/)
* [NodeJS](https://nodejs.org)

## Contact

For open technical issues and questions please create a GitHub issue in this repository. 

?> All inquiries can also be sent to [staple-api@epistemik.co](staple-api@epistemik.co).