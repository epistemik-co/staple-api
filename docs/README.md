## Ontology and schema

Staple API schemas are generated automatically from RDF ontologies expressed in the alightly adapted [schema.org data model](https://schema.org/docs/datamodel.html). This data model is based on the following vocabularies:

```turtle
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
```

and includes the following vocabulary elements:


<!-- tabs:start -->

#### **RDF ontology**

| Construct                     | RDF construct / functionality               |
| ----------------------------- | ------------------------------------------- |
| `rdfs:Class`                  | A class                                     |
| `rdfs:subClassOf`             | A subclass of another class                 |
| `rdf:Property`                | A property                                  |                
| `owl:FunctionalProperty`      | A functional property (accepts at most one value)   |                   
| `rdfs:comment`                | A description of a vocabulary element       |
| `schema:domainIncludes`       | An allowed domain type of a property        |
| `schema:rangeIncludes`        | An allowed range type of a property         |
| `xsd:string`                  | The (xsd) `string` datatype                 |
| `xsd:integer`                 | The (xsd) `integer` datatype                |
| `xsd:decimal`                 | The (xsd) `decimal` datatype                |
| `xsd:boolean`                 | The (xsd) `boolean` datatype                |

#### **GraphQL schema**


| Construct                     | GraphQL functionality / construct           |
| ----------------------------- | ------------------------------------------- |
| `rdfs:Class`                  | A type                                      |
| `rdfs:subClassOf`             | Implicit type inheritance/inference         |
| `rdf:Property`                | A field                                     |                
| `owl:FunctionalProperty`      | A single-valued field                       |                   
| `rdfs:comment`                | A description of a type or field            |
| `schema:domainIncludes`       | A type on which the field occurs   |
| `schema:rangeIncludes`        | The value type of the field                 |
| `xsd:string`                  | `String` scalar type                        |
| `xsd:integer`                 | `Int` scalar type                           |
| `xsd:decimal`                 | `Float` scalar type                         |
| `xsd:boolean`                 | `Bool` scalar type                          |
<!-- tabs:end -->

## RDF ontology

Currently the ontologies accepted by Staple API must be defined in the [RDF Turtle sytnax](https://www.w3.org/TR/turtle/). The following example presents a simple ontology including all supported constructs:


```turtle
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix example: <http://example.com#> .

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
```

In the following points we summarize and further explain specific elements and patterns used in RDF ontologies, using the above one as a running example.

### Prefix declarations

Prefix declarations, placed in the beginning of the ontology, define mappings from the shortcut prefixes for specific vocabularies to the full URI namespaces they denote, e.g.:

```turtle
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix example: <http://example.com#> .
```



### Class definitions

A class definition specifies the name of the class, its description and its direct superclasses, e.g.:

```turtle
example:Person a rdfs:Class ;
    rdfs:comment "A person" ;
    rdfs:subClassOf example:Agent .
```
This definition describes the class `example:Person` as "*A person*" and as a subclass of `example:Agent`. This means that every instance of `example:Person` is indirectly an instance of `example:Agent`. 

!> Note that each class can have zero or more direct superclasses.


### Property definitions

A property definition specifies the name of a property, its description, the classes of objects to which it applies, and the type of values it accepts, e.g.:

```turtle
example:name a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "Name of the agent" ;
    schema:domainIncludes example:Agent ;
    schema:rangeIncludes xsd:string .
```

This definition describes the property `example:name` as "*Name of the agent*". It is declared to be a functional property, meaning that an instance can have at most one value of this property (i.e., one `example:name`). The domain of `example:name` includes `example:Agent`, which means that it applies only to (direct and indirect) instances of `example:Agent` (i.e., including instances of `example:Person` and `example:Organization`). The values of `example:name` must be of type `xsd:string`. 

```turtle
example:employee a rdf:Property ;
    rdfs:comment "An employee of an organization" ;
    schema:domainIncludes example:Organization ;
    schema:rangeIncludes example:Person .
```
This definition describes the property `example:employee` as "*An employee of an organization*". The domain of `example:employee` includes `example:Organization`, which means that it applies only to (direct and indirect) instances of `example:Organization`. The (zero or more) values of `example:employee` must be of type `example:Person`. 

!> Note that each property must have at least one `schema:domainIncludes` value and (currently) exactly one `schema:rangeIncludes` value.
    
### Ontology URIs 

?> A valid URI consists of two parts: **namespace** + **local name**. The namespace of a URI is its initial substring *up to and including* the last symbol `/` or `#`. The local name is the remainder of the string, *after* the last symbol `/` or `#`. For instance, the URI `http://example.com/Name` consists of the namespace `http://example.com/` and the local name `Name`. 

The URIs of classes and properties in the ontology are acceptable by Staple API provided that their local names meet two conditions:
1. are unique across the ontology (e.g., there is no two URIs such as `http://example-domain-1.com/Name` and `http://example-domain-2.com/Name`)

?> Positive example: 
<br> :heavy_check_mark: `http://example.com/Name1` 
<br> :heavy_check_mark: `http://example.com/Name2` 
<br> :heavy_check_mark: `http://example.com#Name1` 
<br> :heavy_check_mark: `http://example.com#Name2`
<br><br> 
Negative example: 
<br> :x: `http://example-domain-1.com/Name` 
<br> :x: `http://example-domain-2.com/Name`

2. are valid GraphQL schema names (matching the regex: `/[_A-Za-z][_0-9A-Za-z]*/`).

?> Positive examples: 
<br> :heavy_check_mark: `http://example.com/Name` 
<br> :heavy_check_mark: `http://example.com/Name123` 
<br> :heavy_check_mark: `http://example.com#_123` 
<br> :heavy_check_mark: `http://example.com#_name`
<br><br> 
Negative examples: 
<br> :x: `http://example.com/name-with-dash` 
<br> :x: `http://example.com#123nameStartingWithDigit`


## GraphQL schema 

The RDF ontology is automatically mapped to the corresponding GraphQL schema. For instance, the ontology above corresponds to the following schema represented in the [Schema Definition Language](https://alligator.io/graphql/graphql-sdl/):


<!-- tabs:start -->

#### **GraphQL schema example (without descriptions)**
```graphql

type Agent {
  name: String
  customerOf: [Organization]
  _id: ID!
  _type(
    inferred: Boolean = false
  ): [String]
}

type Organization {
  name: String
  employee: [Person]
  revenue: Float
  customerOf: [Organization]
  _id: ID!
  _type(
    inferred: Boolean = false
  ): [String]
}

type Person {
  name: String
  age: Int
  isMarried: Boolean
  customerOf: [Organization]
  _id: ID!
  _type(
    inferred: Boolean = false
  ): [String]
}

type _CONTEXT {
  _id: String
  _type: String
  Agent: String
  Organization: String
  Person: String
  name: String
  age: String
  revenue: String
  isMarried: String
  employee: String
  customerOf: String
}

type Query {
  _CONTEXT: _CONTEXT
 
  Agent(
    page: Int = 1
    filter: Agent_FILTER
    inferred: Boolean = false
  ): [Agent]

  Organization(
    page: Int = 1
    filter: Organization_FILTER
    inferred: Boolean = false
  ): [Organization]

  Person(
    page: Int = 1
    filter: Person_FILTER
    inferred: Boolean = false
  ): [Person]
}

input Agent_FILTER {
  _id: [ID]
  name: [String]
  customerOf: [ID]
}

input Organization_FILTER {
  _id: [ID]
  name: [String]
  employee: [ID]
  revenue: [Float]
  customerOf: [ID]
}

input Person_FILTER {
  _id: [ID]
  name: [String]
  age: [Int]
  isMarried: [Boolean]
  customerOf: [ID]
}

type Mutation {
  DELETE(
  _id: ID
  ): Boolean

  Agent(
  type: MutationType = PUT
  input: Agent_INPUT!
  ): Boolean

  Organization(
  type: MutationType = PUT
  input: Organization_INPUT!
  ): Boolean

  Person(
  type: MutationType = PUT
  input: Person_INPUT!
  ): Boolean
}

input Agent_INPUT {
  _id: ID!
  name: String
  customerOf: [ID]
}

input Organization_INPUT {
  _id: ID!
  name: String
  employee: [ID]
  revenue: Float
  customerOf: [ID]
}

input Person_INPUT {
  _id: ID!
  name: String
  age: Int
  isMarried: Boolean
  customerOf: [ID]
}

enum MutationType {
  PUT
}

```
#### **GraphQL schema example (with descriptions)**

```graphql
"""An agent"""
type Agent {
  """Name of the agent"""
  name: String
  """An organization this agent is a customer of"""
  customerOf: [Organization]
  """The unique identifier of the object"""
  _id: ID!
  """Types of the object."""
  _type(
    """Include inferred types for this object"""
    inferred: Boolean = false
  ): [String]
}

"""
An organization such as a school, NGO, corporation, club, etc.
Broader types: Agent
"""
type Organization {
"""Name of the agent"""
  name: String
  """An employee of an organization"""
  employee: [Person]
  """The annual revenue of the organization"""
  revenue: Float
  """An organization this agent is a customer of"""
  customerOf: [Organization]
  """The unique identifier of the object"""
  _id: ID!
  """Types of the object"""
  _type(
    """Include inferred types for this object"""
    inferred: Boolean = false
  ): [String]
}

"""
A person
Broader types: Agent
"""
type Person {
  """Name of the agent"""
  name: String
  """Age of the person"""
  age: Int
  """The person is married"""
  isMarried: Boolean
  """An organization this agent is a customer of"""
  customerOf: [Organization]
  """The unique identifier of the object"""
  _id: ID!
  """Types of the object"""
  _type(
    """Include inferred types for this object"""
    inferred: Boolean = false
  ): [String]
}

"""
The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema.
"""
type _CONTEXT {
  _id: String
  _type: String
  Agent: String
  Organization: String
  Person: String
  name: String
  age: String
  revenue: String
  isMarried: String
  employee: String
  customerOf: String
}

"""Get objects of specific types"""
type Query {
  """
  Get elements of the _CONTEXT object
  """
  _CONTEXT: _CONTEXT
 
  """Get objects of type: Agent"""
  Agent(
    """
    The number of the consecutive results page to be returned by the query
    """
    page: Int = 1
    filter: Agent_FILTER
    """Include inferred objects of this type"""
    inferred: Boolean = false
  ): [Agent]


  """Get objects of type: Organization"""
  Organization(
    """
    The number of the consecutive results page to be returned by the query
    """
    page: Int = 1
    filter: Organization_FILTER
    """Include inferred objects of this type"""
    inferred: Boolean = false
  ): [Organization]


  """Get objects of type: Person"""
  Person(
    """
    The number of the consecutive results page to be returned by the query
    """
    page: Int = 1
    filter: Person_FILTER
    """Include inferred objects of this type"""
    inferred: Boolean = false
  ): [Person]
}

"""Filter on type: Agent"""
input Agent_FILTER {
  """Possible values on field: _id)"""
  _id: [ID]
  """Possible values on field: name"""
  name: [String]
  """Possible values on field: customerOf"""
  customerOf: [ID]
}

"""Filter on type: Organization"""
input Organization_FILTER {
  """Possible values on field: _id)"""
  _id: [ID]
  """Possible values on field: name"""
  name: [String]
  """Possible values on field: employee"""
  employee: [ID]
  """Possible values on field: revenue"""
  revenue: [Float]
  """Possible values on field: customerOf"""
  customerOf: [ID]
}

"""Filter on type: Person"""
input Person_FILTER {
  """Possible values on field: _id)"""
  _id: [ID]
  """Possible values on field: name"""
  name: [String]
  """Possible values on field: age"""
  age: [Int]
  """Possible values on field: isMarried"""
  isMarried: [Boolean]
  """Possible values on field: customerOf"""
  customerOf: [ID]
}

"""CRUD operations over objects of specific types"""
type Mutation {
  """Delete an object"""
  DELETE(
  """An id of the object to be deleted"""
  _id: ID
  ): Boolean

  """Perform mutation over an object of type: Agent"""
  Agent(
  """The type of the mutation to be applied"""
  type: MutationType = PUT
  """The input object of the mutation"""
  input: Agent_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Organization"""
  Organization(
  """The type of the mutation to be applied"""
  type: MutationType = PUT
  """The input object of the mutation"""
  input: Organization_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Person"""
  Person(
  """The type of the mutation to be applied"""
  type: MutationType = PUT
  """The input object of the mutation"""
  input: Person_INPUT!
  ): Boolean
}

"""Input object of type: Agent"""
input Agent_INPUT {
  """The unique identifier of the object"""
  _id: ID!
  """Name of the agent"""
  name: String
  """An organization this agent is a customer of"""
  customerOf: [ID]
}

"""Input object of type: Organization"""
input Organization_INPUT {
  """The unique identifier of the object"""
  _id: ID!
  """Name of the agent"""
  name: String
  """An employee of an organization"""
  employee: [ID]
  """The annual revenue of the organization"""
  revenue: Float
  """An organization this agent is a customer of"""
  customerOf: [ID]
}

"""Input object of type Person"""
input Person_INPUT {
  """The unique identifier of the object"""
  _id: ID!
  """Name of the agent"""
  name: String
  """Age of the person"""
  age: Int
  """This person is married"""
  isMarried: Boolean
  """An organization this agent is a customer of"""
  customerOf: [ID]
}

enum MutationType {
  """
  Put the item into the database. If already exists - overwrite it. 
  """
  PUT
}
```

<!-- tabs:end -->
 
 
The specific mappings and resulting GraphQL schema patterns are further described and explained below.

### Types

Every class (e.g., `example:Person`) is mapped to a GraphQL type called by the local name of the URI (i.e., `Person`). Its fields corrspond to properties with the compatible domain types (see below) and two special ones: 
* `_id` - holding the URI of each instance;
* `_type` - holding the (direct or inherited) types of each instance;


```graphql
type Person {
    _id: ID!
    _type: [String]
    ...
}
```

This type is further associated with a unique query (e.g., `Person`), a query filter (e.g., `Person_FILTER`), a mutation (e.g., `Person`), an input type (e.g., `Person_INPUT`) - all addressed separately below. 

### Fields

Every property (e.g., `example:name`, `example:employee`) is mapped to a field called by the local name of the URI (e.g., `name`, `employee`). The fields are added on all compatible types: 

1. those corresponding to classes declared via `schema:domainIncludes` predicate in the ontology (e.g.: `Agent` for `name`)

2. the inherited ones, which can be reached via a chain of `rdfs:subClassOf` steps in the ontology (e.g.: `Person` and `Organization` for `name`)

The type of values allowed on specific fields is determined by two components:
1. the `schema:rangeIncludes` declarations, e.g.:

```turtle
example:name schema:rangeIncludes xsd:string . 
example:isMarried schema:rangeIncludes xsd:boolean .
example:customerOf schema:rangeIncludes example:Organization .
```

2. by the `owl:FunctionalProperty` declarations on the properties 
    * single values `field: Type` when such declaration is present
    * multiple values `field: [Type]` when such declaration is missing

E.g.:

```turtle
example:name a rdf:Property, owl:FunctionalProperty . 
example:isMarried a rdf:Property, owl:FunctionalProperty . 
example:customerOf a rdf:Property .
```

```graphql
type Person {
    ...
    name: String
    isMarried: Boolean
    customerOf: [Organization]
    ...
}
```
---
Finally, all object types and fields give rise to GraphQL queries, mutations and input objects for mutations, of matching names and structures. 

```graphql
query Person(page: Int) : [Person]
```

```graphql
muation Person(type: MutationType!, input: InputPerson!) : Boolean
```

```graphql
input InputPerson {
    _id: ID!
    _type: [String]
    name: ...
}
```



## JSON-LD context

All type and property URIs used in the ontology and the additional special fields included in the GraphQL schema are automatically mapped to a basic [JSON-LD context](https://json-ld.org/spec/latest/json-ld/#the-context) of the following structure:

```javascript
{
    "_id": "@id",
    "_type": "@type",
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
This context is served via a dedicated `_CONTEXT` query in the Staple API schema and can be used to interepret every Staple API query response and input objects as valid JSON-LD objects (see [data](./data) section)



## Data

The Staple API is intended for managing structured data, i.e., linked data expressed within the [schema.org data model](https://schema.org/docs/datamodel.html). The shape and structure of data objects is sanctioned by the GrapHQL schema, which in turn, reflects the constraints of the ontology model.

For instance, the following objects are valid json data samples compatible with the ontology and schema example described in the [ontology and schema](./schema) section:


```javascript
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

```javascript
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

```javascript  
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

```javascript
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

```javascript
context = {
    "_id": "@id",
    "_value": "@value",
    "_type": "@type",
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

```javascript
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

```javascript
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

```javascript
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

```ntriple
<http://example.com/elisabeth> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .
<http://example.com/elisabeth> <http://schema.org/name> "Queen Elisabeth"^^<http://schema.org/Text> .
<http://example.com/elisabeth> <http://schema.org/birthPlace> <http://example.com/uk> .
<http://example.com/elisabeth> <http://schema.org/children> <http://example.com/charles> .
```

---
Turtle (RDF):

```turtle
@prefix schema: <http://schema.org/> .
@prefix example: <http://example.com/> .

exmple:elisabeth a schema:Person ;
    schema:name "Queen Elisabeth"^^schema:Text ;
    schema:birthPlace example:uk ;
    schema:children example:charles .
```


Nested JSON objects are mapped to JSON-LD and interpretted as semantic graphs in an analogical fashion, for instance:

```javascript
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


```turtle
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

## Query

By default the Staple API exposes three types of queries: 

1. Object queries corresponding to object types.
2. Special _CONTEXT query returning URIs of selected vocabulary items. 
3. Special _OBJECT query returning all objects created via the Staple API.



### Object type queries

Each object type in the schema has a unique corresponding query of the same name and a fixed structure. For instance, instances of the type `Person` can be requested with the query:

```graphql
query Person(page: Int) : [Person]
```

These are standard GraphQL queries deterimned be the structure of the schema. For instance:

```graphql

{
  Person {
    _id
    _type
    name {
      _value
      _type
    }
    brithPlace {
      _id
    }
    children {
      _id
      birthPlace {
        _id
        name {
          _value
          _type
        }
      }
    }
  }
}
```

The following query could return the response:

```javascript
{
  "data": {
    "Person": [
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
      },
      ...
    ]
  }
}
```





<!-- ### (V) Validation rules

> `[WARNING]` fields with mandatory properties must have a value.

> `[WARNING]` single-valued fields must have at most one value.

> `[WARNING]` the existing values of fields must match the declared target types of these fields. -->



### _CONTEXT

This query field returns a unique `_CONTEXT` object, which represents the expanded JSON-LD context that is assumed in the Staple API instance:

This corresponds directly to the associated JSON-LD context:

```javascript
"@context": {
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


```graphql
{
  _CONTEXT {
    _id
    _type
    Person
    name
    birthPlace
  }
}
```

```javascript
{
  "data": {
    "_CONTEXT": {
      "_id": "@id",
      "_type": "@type",
      "Person": "http://schema.org/Person",
      "name": "http://schema.org/name",
      "birthPlace": "http://schema.org/birthPlace"
    }
  }
}
```




## Inference

There are a few inference mechanisms that can be employed in managing structured data in Staple API.

### Type inference (a.k.a. inheritance)

The type inference mechanism enables to query and validate objects by their implicit (indirect) types, i.e., those that are only inferred from the type hierarchy in the ontology but not explicitly asserted on the input. 

For instance, a sample ontology in the [example above](./schema) states that `schema:Person rdfs:subClassOf schema:Thing`, i.e., that `Person` is a more specific class than `Thing`, or conversely that `Thing` is a broader class than `Person`. There are several logical consequences of that statement:

1. type `Person` inherits all properties of type `Thing`, meaning that properties of `Thing` are also permitted on objects of type `Person` (but not neccesarily the other way around);
2. every object that is of type `Person` is also of type `Thing` (but not neccesarily the other way around);
3. every object that is of type `Person` is a valid filler for any property that requires its values to be of type `Thing` (but not the other way around).

To find all (indirect / inferred) instances of a certain type you can use the `inferred: true` argument on the respective query. Compare for instance:

---
Without inference:

```graphql
{
  Thing {
    _id
  }
}
```

```graphql
{
  "data": {
    "Thing": [
    ]
  }
}
```


---
With inference:

```graphql
{
  Thing(inferred:true) {
    _id
  }
}
```

```javascript
{
  "data": {
    "Thing": [
      {
        "_id": "http://example.com/elisabeth"
      },
      {
        "_id": "http://example.com/charles"
      },
      {
        "_id": "http://example.com/william"
      },
      {
        "_id": "http://example.com/uk"
      }
    ]
  }
}
```


<!-- The inheritance mechanism from point 1 is already exploited when generating GraphQL schema. Points 2 and 3 require implementation of an **inference** mechanism on the instance data-level. 

The basic strategy is to store and maintain the valid list of all asserted and inferred types for each object and refresh it on any relevant mutation. The initial proposal is to use the current property `_type / @type / rdf:type` for storing explicitly asserted types and property `http://staple-api.org/datamodel/type` (`staple:type`) for storing all asserted and inferred types together. The values of `http://staple-api.org/datamodel/type` will be used when:

1. Searching for objects of a certain type. 
2. Validating whether a certain object has a required type. 

For instance, suppose the following mutation is made:

```javascript
mutation {
  Organization(type:INSERT, input: {
    _id: "http://org_person",
    _type: [Organization, Person]
  })
}
```

In the database we should insert the following quads:
* `http://org_person rdf:type schema:Organization`
* `http://org_person rdf:type schema:Person` 

Further, we should add all the inferred ones:
* `http://org_person staple:type schema:Organization`
* `http://org_person staple:type schema:Person`
* `http://org_person staple:type schema:Thing`

Whenever any type is removed or added to from the list of `rdf:type` values, the values of `staple:type` should be all deleted, recomputed and inserted again. 

For each type, the set of its supertypes (i.e., the types that always have to be inferred) is given in the original `context.jsonld` file. 

It must be ensured that `http://org_person staple:type schema:Thing` is never removed, even if all `rdf:type` get, because this designated type assertion has a special meaning, namely, that the given object exists in the database (see section [/query](https://github.com/epistemik-co/staple-api-docs/tree/master/query#_object)). -->

### Inverse properties

Some properties might be defined as inverses of other properties. For instance:

```
schema:parent schema:inverseOf schema:parent
```

The logical meaning of inverse property relationship is encapsulated in the following inference rules:

```
IF (P1 schema:inverseOf P2) AND (sub P1 obj) THEN (obj P2 sub)

IF (P1 schema:inverseOf P2) AND (sub P2 obj) THEN (obj P1 sub)
```

For instance:

```
IF (parent schema:inverseOf parent) AND (mary parent john) THEN (john parent mary)

IF (parent schema:inverseOf parent) AND (john parent mary) THEN (mary parent john)
```

Consequently, whenever a relationship in one direction is inserted the other one is automatically generated. And if one is deleted, the other gets deleted as well. 


## Mutations

Mutations are designated for performing a range of CRUD operations over the structured data. 

There are five different mutation types:
1. CREATE (id)
2. DELETE (id)
3. INSERT (input object)
4. REMOVE (input object)
5. UPDATE (input object)



### Examples

The following example shows default mutations in a schema with two object types `Organization` and `Person`:

```javascript
CREATE(id: ID!): Boolean
DELETE(id: ID!): Boolean
Person(type: MutationType! ensureExists: Boolean! input: Person_INPUT!): Boolean
```


### CREATE 

For an object `URI`, explicitly creates that object in the database (see also [_OBJECT query](https://github.com/epistemik-co/staple-api-docs/tree/master/query#_object) section)

For instance:
```javascript
CREATE(id: "http://example.com/elisabeth")
```

* (V) Validation rules

> `[ERROR]` The object cannot exist in the database prior to this request.

Returns true only if successfully added the triple. 

### DELETE 

For an object `URI`, removes all quads `URI ?p ?o` and `?s ?p URI` from the datatbase.

For instance:
```javascript
DELETE(id: "http://example.com/elisabeth")
```

* (V) Validation rules

> `[ERROR]` The object must exist in the database prior to this request.

Returns true only if successfully removed all triples. 


### Types-specific mutations

The following example shows a `INSERT` mutation request on the `Person` type in two variants. Firstly, using the basic GraphQL query:

```javascript
QUERY:

mutation {
  Person(type: INSERT, ensureExists: false, input: {
        _id: "http://example.com/elisabeth"
        _type: Person
        children: [
            {
                _id: "http://example.com/charles"
            }
        ]
        name: {
            _type: Text,
            _value: "Queen Elisabeth"
        },
        birthPlace: {
            _type: Place
            _id: "http://example.com/"
    }
  }) 
}

```

Alternatively, as a GraphQL request with query variables:

```
QUERY:

mutation Person($type: MutationType!, $input: Person_INPUT!) {
  Person(type: $type, ensureExists: false, input: $input)
}



QUERY VARIABLES:

{
  "type": "INSERT",
  "input": {
        "_id": "http://example.com/elisabeth",
        "_type": "Person",
        "children": [
            {
                "_id": "http://example.com/charles"
            }
        ]
        "name": {
            "_type": "Text",
            "_value": "Queen Elisabeth"
        },
        "birthPlace": {
            "_type": "Place"
            "_id": "http://example.com/"
    }
}
```


### Input objects

Object mutations (`INSERT`, `UPDATE`, `REMOVE`) take as a parameter an `input object`. Input objects are essentially flattened JSON-LD objects (matching the schema) without the `@context` key (see [data section](https://github.com/epistemik-co/staple-api-docs/tree/master/data)). 

For example, assuming the context and the schema used in all the running examples in this documentation the following are three possible, valid input objects:

```javascript
{
    "_id": "http://example.com/elisabeth",
    "_type": "Person",
    "children": [
        {
            "_id": "http://example.com/charles"
        }
    ]
    "name": {
        "_type": "Text",
        "_value": "Queen Elisabeth"
    },
    "birthPlace": {
        "_type": "Place"
        "_id": "http://example.com/"
    }
}
```

```javascript
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

```javascript
{
  "_id": "http://example.com/uk",
  "_type": "Place",
  "name": {
      "_value": "Great Britain",
      "_type": "Text"
  }
}
```

Specifically, this flattened form of input objects must satisfy the following requirements:

* (V) Validation rules

> [GRAPHQL-ERROR] the depth of the json object is at most 1 (where 0 is a flat key-value map, and 1 is a key-value map, where some values might also be key-value maps or arrays of key-value maps)

> [GRAPHQL-ERROR] the key-value maps on level 1, might only be of one of the two possible forms specified below.

* Acceptable forms of the key-value maps on level 1

```javascript
{
    "_id": String,
}
```

where `_id` is a valid URI. This form is designated for representing pure references to named objects;

**NOTE**: this form of objects will also accept `_type` key with the value of the object type allowed for the given property. However, its use is discouraged, as it may lead to unintended type insertions / removals of the nested objects. Ideally, type information about objects should only be given on the top level of the input object.

```javascript
{
    "_value": String,
    "_type": String
}
```
where `_value` is the string value of a literal and `_type` the name of its datatype as caputred in the associated JSON-LD context. Both fields are **mandatory**.

Hence, the input object provided in any mutation type, must pass the following validation rules:

* (V) Validation rules

> `[ERROR]` the input object is a valid flattened JSON-LD object under the assumed context

> `[ERROR]` the value of all `_id` keys in the object are valid URIs

> `[ERROR]` **IF** datatypes are associated with some additional validators, these has to be positively verified on the provided values.

* Conversion to quads
In the following, by `RDF(input)` we denote the set of triples obtained by converting the input object, under the associated context, into a set of N-Quads.

### INSERT

Inserts data about certain object into the database. 

```javascript
{
  "type": "INSERT",
  "input": {
    "_id": "http://example.com/elisabeth",
    "_type": "Person",
    "children": [
        {
            "_id": "http://example.com/charles"
        }
    ]
    "name": {
        "_type": "Text",
        "_value": "Queen Elisabeth"
    },
    "birthPlace": {
        "_type": "Place"
        "_id": "http://example.com/"
    }
}
```


* (V) Validation rules

> `[GRAPHQL-ERROR]` only properties present in the given type should be present.

> `[ERROR]` single-valued fields accept at most one value.

> `[WARNING]` the values in the fields must (ultimately) match the declared target types of these fields (e.g., `http://example.com/elisabeth` must eventually be a `Person`)

> `[ERROR]` all objects mentioned in the input object must exist prior to this request whenever `ensureExists=true`. 




<!-- ### Action
> Insert `RDF(input)` into the database. 

> Assert the root object as the instance of the type corresponding to the mutation by default (e.g.: `http://data/bluesB a schema:Organization`).

> Create all objects (URIs used as values of `_id`) in the input object whenever they do not exist (and `ensureExists=false`). 

> Recompute the inferred types (see [/inference](/inference)) -->


### REMOVE

Removes data about certain object from the database.

```javascript
{
  "type": "REMOVE",
  "input": {
    "_id": "http://example.com/elisabeth",
    "_type": "Person",
    "children": [
        {
            "_id": "http://example.com/charles"
        }
    ]
    "name": {
        "_type": "Text",
        "_value": "Queen Elisabeth"
    },
    "birthPlace": {
        "_type": "Place"
        "_id": "http://example.com/"
    }
}
```


* (V) Validation rules

> `[GRAPHQL-ERROR]` only properties present in the given type should be present.

> `[WARNING]` each object must have at least one type.

> `[WARNING]` fields with mandatory properties must (ultimately) have a value.

> `[ERROR]` all objects mentioned in the input object must exist prior to this request whenever `ensureExists=true`. 

<!-- 
### Action
> Remove `RDF(input)` from the database.
 -->

### UPDATE

For an object `URI`, replaces all data about this object with the new one. 


```javascript
{
  "type": "UPDATE",
  "input": {
    "_id": "http://example.com/elisabeth",
    "_type": "Person",
    "children": [
        {
            "_id": "http://example.com/charles"
        }
    ]
    "name": {
        "_type": "Text",
        "_value": "Queen Elisabeth"
    },
    "birthPlace": {
        "_type": "Place"
        "_id": "http://example.com/"
    }
}
```

* (V) Validation rules

> `[ERROR]` all objects mentioned in the input object must exist prior to this request whenever `ensureExists=true`. 

<!-- 

### Action

Removes all and only quads `URI ?p ?o` from the datatbase (except for when `?p == "http://schema-api.org/datamodel/type"`), and inserts the input object. -->
