## Overview

**Staple API** is a simple GraphQL-based API for managing **semantic knowledge graphs**. Such graphs are expressed and modeled as linked data in the [schema.org data model](https://schema.org/docs/datamodel.html)). 

!> **Note**: *This project is at very early stages of development*

Current features include:

- [x] Automatic generation of GraphQL schema from an RDF ontology.
- [x] Automatic generation of resolvers for a set of default queries and mutations.
- [x] Addition of JSON-LD context enabling immediate mapping of API responses to JSON-LD objects. 
- [x] A default connector to a MongoDB backend for storing data.

<br>

<p align="center">
  <img src="staple-api-architecture.png">
</p>


## Playground

The live playground is available at: [http://playground.staple-api.org](http://playground.staple-api.org).


## GitHub

The GitHub repository is available at: [https://github.com/epistemik-co/staple-api](https://github.com/epistemik-co/staple-api).

## License

This software is available under the [MIT license](https://github.com/epistemik-co/staple-api/blob/master/LICENSE).

## Technologies used

* [GraphQL](https://graphql.org/)
* [Apollo Server](https://www.apollographql.com/)
* [schema.org](http://schema.org)
* [JSON-LD](https://json-ld.org)
* [Graphy](https://graphy.link/)
* [NodeJS](https://nodejs.org)

## Contact

For open technical issues and inquiries feel free to create a GitHub issue in this repository. All questions can also be sent to [staple-api@epistemik.co](staple-api@epistemik.co).