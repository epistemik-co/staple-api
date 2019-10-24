# staple-api-schema
Staple API schema generation tools

# Current status
The script processes `schema.ttl` file (an RDF/Turtle serialisation of the `schema.org` ontology) and generates two output files:

* `schema.graphql` - the corresponding GraphQL/StapleAPI schema 
* `context.jsonld` - a jsonld file containing the LD context for the GraphQL/StapleAPI schema 

Each schema item listed and mapped to a URI in the `@context` section of `context.jsonld` is associated, in the subsequent part of the file, with one (and only one) of three resources:

* `http://www.w3.org/2000/01/rdf-schema#Class` - corrsponding to object types
* `http://schema.org/DataType` - corresponding to data types
* `http://www.w3.org/1999/02/22-rdf-syntax-ns#Property` - corresponding to fields

**Comments**:

* note that the `schema.graphql` is merely an SDL printout of a valid GraphQL schema object, which is effectively generated while processing the ontology, so this script can be integrated directly to the StapleAPI code base, in order to support generation of StapleAPI schema directly from an RDF file. 

* the script should be able to process any ontology expressed in the `schema.org` [data model](https://schema.org/docs/datamodel.html), but hasn't been tested yet. 
