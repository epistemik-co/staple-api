# Data

The Staple API is intended for managing structured data, i.e., linked data expressed within the [schema.org data model](https://schema.org/docs/datamodel.html). The shape and structure of data objects is sanctioned by the GrapHQL schema, which in turn, reflects the constraints of the ontology model.

For instance, the following objects are valid json data samples compatible with the ontology and schema example described in the [ontology and schema](./schema) section:


```json
{
  "_id": "http://example.com/elisabeth",
  "_type": "Person",
  "name": {
      "_value": "Queen Elisabeth",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/charles"
    }
  ]
}
```

```json
{
  "_id": "http://example.com/charles",
  "_type": "Person",
  "name": {
      "_value": "Prince Charles",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/william"
    }
  ]
}
```

```json  
{
  "_id": "http://example.com/william",
  "_type": "Person",
  "name": {
      "_value": "Prince William",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  }
}
```

```json
{
  "_id": "http://example.com/uk",
  "_type": "Place",
  "name": {
      "_value": "Great Britain",
      "_type": "Text"
  }
}
```

Every valid Staple API data object is a valid JSON-LD when extended with the context served by the API. For instance, the objects listed above should be interpreted as JSON-LD under the context:

```json
context = {
    "_id": "@id",
    "_value": "@value",
    "_type": "@type",
    "_reverse": "@reverse",
    "Thing": "http://schema.org/Thing",
    "Person": "http://schema.org/Person",
    "Place": "http://schema.org/Place",
    "Text": "http://schema.org/Text",
    "name": "http://schema.org/name",
    "birthPlace": "http://schema.org/birthPlace",
    "parent": "http://schema.org/parent",
    "children": "http://schema.org/children"
}
```

Thanks to the fixed JSON-LD context assumed and exposed by the API, each data sample, whether part of the input for mutations or a reponse to a query, can be interpreted as a fragment of a larger linked data graph and transformed (e.g., using [JSON-LD Playground](https://json-ld.org/playground/)) into a number of semantically equivallent formats, without loss of the meaning or inviting any semantic ambiguities. 

For instance, the following are some self-contaiend semantic representations of the JSON data object:

```json
{
  "_id": "http://example.com/elisabeth",
  "_type": "Person",
  "name": {
      "_value": "Queen Elisabeth",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/charles"
    }
  ]
}
```

---
Flatenned JSON-LD:

```json
{
  "@context": context,
  "_id": "http://example.com/elisabeth",
  "_type": "Person",
  "name": {
      "_value": "Queen Elisabeth",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/charles"
    }
  ]
}
```

---
Expanded JSON-LD:

```json
{
  "@context": context,
  "_id": "http://example.com/elisabeth",
  "_type": "http://schema.org/Person",
  "http://schema.org/name": {
      "_value": "Queen Elisabeth",
      "_type": "http://schema.org/Text"
  },
  "http://schema.org/birthPlace": {
    "_id": "http://example.com/uk"
  },
  "http://schema.org/children": [
    {
      "_id": "http://example.com/charles"
    }
  ]
}
```

---
N-Triples (RDF):

```
<http://example.com/elisabeth> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .
<http://example.com/elisabeth> <http://schema.org/name> "Queen Elisabeth"^^<http://schema.org/Text> .
<http://example.com/elisabeth> <http://schema.org/birthPlace> <http://example.com/uk> .
<http://example.com/elisabeth> <http://schema.org/children> <http://example.com/charles> .
```

---
Turtle (RDF):

```
@prefix schema: <http://schema.org/> .
@prefix example: <http://example.com/> .

exmple:elisabeth a schema:Person ;
    schema:name "Queen Elisabeth"^^schema:Text ;
    schema:birthPlace example:uk ;
    schema:children example:charles .
```


Nested JSON objects are mapped to JSON-LD and interpretted as semantic graphs in an analogical fashion, for instance:

```json
{
  "@context": context,
  "_id": "http://example.com/elisabeth",
  "_type": "Person",
  "name": {
      "_value": "Queen Elisabeth",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/charles",
      "name": {
          "_value": "Prince Charles"
      },
      "birthPlace": {
        "_id": "http://example.com/uk",
        "_type": "Place",
        "name": {
          "_value": "Great Britain",
          "_type": "Text"
        }
      }
    }
  ]
}
```

translates into the following Turtle (RDF) data:


```
@prefix schema: <http://schema.org/> .
@prefix example: <http://example.com/> .

exmple:elisabeth a schema:Person ;
    schema:name "Queen Elisabeth"^^schema:Text ;
    schema:birthPlace example:uk ;
    schema:children example:charles .

example:charles schema:name "Prince Charles" ;
    schema:birthPlace example:uk .

example:uk a schema:Place ;
    schema:name "Great Britain"^^schema:Text .
```
