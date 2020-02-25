## Introduction

**Staple API** is a lightweight GraphQL-based API enabling easy management of **knowledge graphs**, virtualized as linked data and structured by an RDF ontology. The two driving principles behind the design of the API are:
1. The core GraphQL service with its schema and resolvers is **induced fully automatically from a simple RDF ontology** and is coupled with a selected backend (currently only MongoDB or an in-memory graph databse). This makes configuring and starting the API possible in mere minutes. 
2. All CRUD operations are done entirely via **the standard GraphQL interface and based exlusively on JSON** objects. This makes data management simple and intuitive for majority of developers. The semantic knowledge graph is an abstraction of the data and is virtulized as linked data via the optional JSON-LD JSON-to-graph mapping mechanism. 

<br> 

<p align="center">
  <img src="staple-api-architecture2.png">
</p>

## Ontology and schema

Staple API schema is generated automatically from an RDF ontology expressed in an extension of the [schema.org data model](https://schema.org/docs/datamodel.html). This data model is based on the following vocabularies:

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

| RDF construct                 | Description                                 |
| ----------------------------- | ------------------------------------------- |
| `rdfs:Class`                  | A class                                     |
| `rdfs:subClassOf`             | A subclass of another class                 |
| `rdf:Property`                | A property                                  |                
| `owl:FunctionalProperty`      | A functional property (at most one value)   |                   
| `rdfs:comment`                | A description of a vocabulary element       |
| `schema:domainIncludes`       | An allowed domain type of a property        |
| `schema:rangeIncludes`        | An allowed range type of a property         |
| `xsd:string`                  | The (xsd) `string` datatype                 |
| `xsd:integer`                 | The (xsd) `integer` datatype                |
| `xsd:decimal`                 | The (xsd) `decimal` datatype                |
| `xsd:boolean`                 | The (xsd) `boolean` datatype                |

#### **GraphQL schema**


| RDF construct                 | GraphQL functionality / construct           |
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
@prefix example: <http://example.com/> .
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
    page: Int
    filter: FilterAgent
    inferred: Boolean = false
  ): [Agent]

  Organization(
    page: Int
    filter: FilterOrganization
    inferred: Boolean = false
  ): [Organization]

  Person(
    page: Int
    filter: FilterPerson
    inferred: Boolean = false
  ): [Person]
}

input FilterAgent {
  _id: [ID]
  name: [String]
  customerOf: [ID]
}

input FilterOrganization {
  _id: [ID]
  name: [String]
  employee: [ID]
  revenue: [Float]
  customerOf: [ID]
}

input FilterPerson {
  _id: [ID]
  name: [String]
  age: [Int]
  isMarried: [Boolean]
  customerOf: [ID]
}

type Mutation {
  DELETE(
    _id: [ID]
  ): Boolean

  Agent(
    type: MutationType = PUT
    input: InputAgent!
  ): Boolean

  Organization(
    type: MutationType = PUT
    input: InputOrganization!
  ): Boolean

  Person(
    type: MutationType = PUT
    input: InputPerson!
  ): Boolean
}

input InputAgent {
    _id: ID!
    name: String
  customerOf: [ID]
}

input InputOrganization {
  _id: ID!
  name: String
  employee: [ID]
  revenue: Float
  customerOf: [ID]
}

input InputPerson {
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
  """@id"""
  _id: String
  """@type"""
  _type: String
  """http://example.com/Agent"""
  Agent: String
  """http://example.com/Organization"""
  Organization: String
  """http://example.com/Person"""
  Person: String
  """http://example.com/name"""
  name: String
  """http://example.com/age"""
  age: String
  """http://example.com/revenue"""
  revenue: String
  """http://example.com/isMarried"""
  isMarried: String
  """http://example.com/employee"""
  employee: String
  """http://example.com/customerOf"""
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
    The number of results page to be returned by the query. A page consists of 10 results. If no page argument is provided all matching results are returned. 
    """
    page: Int
    """Filters the selected results based on specified field values"""
    filter: FilterAgent
    """Include indirect instances of this type"""
    inferred: Boolean = false
  ): [Agent]


  """Get objects of type: Organization"""
  Organization(
    """
    The number of results page to be returned by the query. A page consists of 10 results. If no page argument is provided all matching results are returned. 
    """
    page: Int
    """Filters the selected results based on specified field values"""
    filter: FilterOrganization
    """Include indirect instances of this type"""
    inferred: Boolean = false
  ): [Organization]


  """Get objects of type: Person"""
  Person(
    """
    The number of results page to be returned by the query. A page consists of 10 results. If no page argument is provided all matching results are returned. 
    """
    page: Int
    """Filters the selected results based on specified field values"""
    filter: FilterPerson
    """Include indirect instances of this type"""
    inferred: Boolean = false
  ): [Person]
}

"""Filter on type: Agent"""
input FilterAgent {
  """Possible identifiers"""
  _id: [ID]
  """Possible values on field: name"""
  name: [String]
  """Possible values on field: customerOf"""
  customerOf: [ID]
}

"""Filter on type: Organization"""
input FilterOrganization {
  """Possible identifiers"""
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
input FilterPerson {
  """Possible identifiers"""
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
    _id: [ID]
  ): Boolean

  """Perform mutation over an object of type: Agent"""
  Agent(
    """The type of the mutation to be applied"""
    type: MutationType = PUT
    """The input object of the mutation"""
    input: InputAgent!
  ): Boolean

  """Perform mutation over an object of type: Organization"""
  Organization(
    """The type of the mutation to be applied"""
    type: MutationType = PUT
    """The input object of the mutation"""
    input: InputOrganization!
  ): Boolean

  """Perform mutation over an object of type: Person"""
  Person(
    """The type of the mutation to be applied"""
    type: MutationType = PUT
    """The input object of the mutation"""
    input: InputPerson!
  ): Boolean
}

"""Input object of type: Agent"""
input InputAgent {
  """The unique identifier of the object"""
  _id: ID!
  """Name of the agent"""
  name: String
  """An organization this agent is a customer of"""
  customerOf: [ID]
}

"""Input object of type: Organization"""
input InputOrganization {
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
input InputPerson {
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

### Object types

Every class (e.g., `example:Person`) is mapped to a GraphQL type called by the local name of the URI (i.e., `Person`). Its fields corrspond to properties with the compatible domain types (see below) and two special ones: 
* `_id` - holding the URI of each instance;
* `_type` - holding the (direct or inferred) types of each instance;


```graphql
type Person {
    _id: ID!
    _type(
        inferred: Boolean = false
      ): [String]
    ...
}
```

Each object type is further associated with a unique query (e.g., `Person`), a query filter (e.g., Filter`Person`), a mutation (e.g., `Person`), an input type (e.g., Input`Person`) - all described separately below. 

### Fields

Every property (e.g., `example:name`, `example:employee`) is mapped to a field called by the local name of the URI (e.g., `name`, `employee`). The fields are added on all compatible types: 

1. those corresponding to classes declared via `schema:domainIncludes` predicate in the ontology (e.g.: `Agent` for `name`)

2. the inherited ones, which can be reached via a chain of `rdfs:subClassOf` steps in the ontology (e.g.: `Person` and `Organization` for `name`)

The type of values allowed on specific fields is determined by two components:
1. the `schema:rangeIncludes` declarations (e.g., `String` on `name` or `Organization` on `customerOf`)
2. by the `owl:FunctionalProperty` declarations on the properties: 
    * single values `field: Type` when such declaration is present (e.g., `name: String`)
    * multiple values `field: [Type]` when such declaration is missing (e.g., `customerOf: [Organization]`)

For example:

<!-- tabs:start -->

#### **Ontology**

```turtle
example:Person rdfs:subClassOf example:Agent .

example:name a rdf:Property, owl:FunctionalProperty ;
    schema:domainIncludes example:Agent ; 
    schema:rangeIncludes xsd:string . 

example:isMarried a rdf:Property, owl:FunctionalProperty ; 
    schema:domainIncludes example:Person ;
    schema:rangeIncludes xsd:boolean .

example:customerOf a rdf:Property ;
    schema:domainIncludes example:Agent ;
    schema:rangeIncludes example:Organization .
```


#### **GraphQL**

```graphql
type Agent {
    ...
    name: String
    customerOf: [Organization]
    ...
}

type Person {
    ...
    name: String
    isMarried: Boolean
    customerOf: [Organization]
    ...
}
```

<!-- tabs:end -->


### Queries and mutations


Each object type is associated with a unique query (e.g., `Person`), a query filter (e.g., Filter`Person`), a mutation (e.g., `Person`), an input type (e.g., Input`Person`). All of them are based on the same structural templates applied across all the types:


<!-- tabs:start -->

#### **type**

```graphql
type Type {
  field1: Type1
  field2: [Type2]
  ...
  _id: ID!
  _type(
    inferred: Boolean = false
  ): [String]
}
```

#### **query**

```graphql
type Query { 
  
  Type(
    page: Int
    filter: FilterType
    inferred: Boolean = false
  ): [Type]
  
}
```

#### **filter**

```graphql
input FilterType {
  _id: [ID]
  field1: [Type1]
  field2: [Type2]
  ...
}
```


#### **mutation**

```graphql
type Mutation {

  Type(
    type: MutationType = PUT
    input: InputType!
  ): Boolean

}
```

#### **input**

```graphql
input InputType {
  _id: ID!
  field1: Type1
  field2: [Type2]
  ...
}
```

<!-- tabs:end -->


For instance:


<!-- tabs:start -->

#### **type Person**

```graphql
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
```

#### **query Person**

```graphql
type Query { 
  
  Person(
    page: Int
    filter: FilterPerson
    inferred: Boolean = false
  ): [Person]
  
}
```

#### **input FilterPerson**

```graphql
input FilterPerson {
  _id: [ID]
  name: [String]
  age: [Int]
  isMarried: [Boolean]
  customerOf: [ID]
}
```


#### **mutation Person**

```graphql
type Mutation {

  Person(
    type: MutationType = PUT
    input: InputPerson!
  ): Boolean

}
```

#### **input InputPerson**

```graphql
input InputPerson {
  _id: ID!
  name: String
  age: Int
  isMarried: Boolean
  customerOf: [ID]
}
```

<!-- tabs:end -->


#### Queries and filters

An object query returns instances of the type with the same name (e.g., query `Person` returns instances of type `Person`). It supports three arguments:
- `page: Int`: specifies the number of results page to be returned by the query. A page consists of 10 results. If no page argument is provided all matching results are returned. 
- `filter: FilterType`: filters the results based on lists of acceptable values specified for each field
- `inferred: Boolean = false`: specifies whether the indirect instances of this type should also be included in the results

For instance, the following query returns the first page of instances of type `Person`, whose names are "John Smith" and who are customers of either `http://example.com/org1` or `http://example.com/org2`:

```graphql
{
  Person(
    page: 1, 
    filter: {
      name: ["John Smith"], 
      customerOf: ["http://example.com/org1", "http://example.com/org2"]
    })  {
          _id
          _type 
          name
          customerOf
        }
}
```

!> All queries return instances of the type synonymous with those queries. 

#### Mutations and inputs

An object mutation enables creation and updates of instances of the type with the same name (e.g., mutation `Person` creates/updates instances of type `Person`). It supports two arguments:
- `type: MutationType = PUT`: defines the type of mutation to be performed. THe default and currently the only acceptable mutation type is PUT, which either creates a new object with a given identifer or overwrites an existing one. 
- `input: InputType!`: specifies the object of a given type to be inserted into the database. 

The input object includes the exact same fields as the associated object type, except for `_type` which is inserted automatically using the associated type as the default value. For instance, the following mutation generates an instance of `Person` with the specified attributes, which can be retrived back with the approporiate `Person` query:


<!-- tabs:start -->

#### **mutation**

```graphql
mutation {
  Person {
    input: {
      _id: "http://example.com/john"
      name: "John Smith"
      age: "35"
      isMarried: true
      customerOf: ["http://example.com/bank", "http://example.com/mobile"]
    }
  }
}
```

#### **query**

```graphql
{
  Person(
    filter: {
      _id_: ["http://example.com/john"]
    })  {
          _id
          _type (inferred: true)
          name
          age
          isMarried
          customerOf {
            _id
          }
        }
}
```

#### **response**

```javascript
{
  "data": {
    "Person": [
      {
        "_id": "http://example.com/john",
        "_type": [
          "Person",
          "Agent"
        ],
        "name": "John Smith",
        "age": 35,
        "isMarried": true,
        "customerOf": [
          {
            "_id": "http://example.com/bank" 
          },
          {
            "_id": "http://example.com/mobile"
          }
        ]
      }
    ]
  }
}
```

<!-- tabs:end -->



Finally, GraphQL exposes also a unique `DELETE` mutation which deletes an object by its identifier specified in the `_id` argument:

```graphql
type Mutation {
  
  DELETE(
    _id: [ID]
  ): Boolean

}
```

For instance:

```graphql
mutation {
  DELETE (id: ["http://example.com/john"])
}
```

!> All mutations return `true` whenever they succeed and `false` otherwise. 




### JSON-LD context


All type and property URIs used in the ontology and the additional special fields included in the GraphQL schema are automatically mapped to a basic JSON-LD context. 

?> [JSON-LD context](https://json-ld.org/spec/latest/json-ld/#the-context) is the key mechanism involved in the JSON-LD standard, which to interpret plain JSON objects as RDF data, or conversely to encode RDF data in the JSON format. 

For instance, the running example used in this section would be associated with the following context, which enables automated conversions of GraphQL responses to RDF:


<!-- tabs:start -->

#### **JSON-LD context**

```javascript
{
  "_id": "@id",
  "_type": "@type",
  "Agent": "http://example.com/Agent",
  "Organization": "http://example.com/Organization",
  "Person": "http://example.com/Person",
  "name": "http://example.com/name",
  "age": "http://example.com/age",
  "revenue": "http://example.com/revenue",
  "isMarried": "http://example.com/isMarried",
  "employee": "http://example.com/employee",
  "customerOf": "http://example.com/customerOf"
}
```

#### **GraphQL response**

```javascript
{
  "data": {
    "Person": [
      {
        "_id": "http://example.com/john",
        "_type": [
          "Person",
          "Agent"
        ],
        "name": "John Smith",
        "age": 35,
        "isMarried": true,
        "customerOf": [
          {
            "_id": "http://example.com/bank" 
          },
          {
            "_id": "http://example.com/mobile"
          }
        ]
      }
    ]
  }
}
```

#### **JSON-LD object**
See in [JSON-LD Playground](https://tinyurl.com/t4ntoq7).

```javascript
{
  "@context": {
    "_id": "@id",
    "_type": "@type",
    "Agent": "http://example.com/Agent",
    "Organization": "http://example.com/Organization",
    "Person": "http://example.com/Person",
    "name": "http://example.com/name",
    "age": "http://example.com/age",
    "revenue": "http://example.com/revenue",
    "isMarried": "http://example.com/isMarried",
    "employee": "http://example.com/employee",
    "customerOf": "http://example.com/customerOf"
  },
  "@id": "@graph",
  "Person": [
    {
      "_id": "http://example.com/john",
      "_type": [
        "Person",
        "Agent"
      ],
      "name": "John Smith",
      "age": 35,
      "isMarried": true,
      "customerOf": [
        {
          "_id": "http://example.com/bank" 
        },
        {
          "_id": "http://example.com/mobile"
        }
      ]
    }
  ]
}
```

#### **RDF data**
See in [JSON-LD Playground](https://tinyurl.com/t4ntoq7).

```ntriple
<http://example.com/john> <http://example.com/age> "35"^^<http://www.w3.org/2001/XMLSchema#integer> .
<http://example.com/john> <http://example.com/customerOf> <http://example.com/bank> .
<http://example.com/john> <http://example.com/customerOf> <http://example.com/mobile> .
<http://example.com/john> <http://example.com/isMarried> "true"^^<http://www.w3.org/2001/XMLSchema#boolean> .
<http://example.com/john> <http://example.com/name> "John Smith" .
<http://example.com/john> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.com/Agent> .
<http://example.com/john> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.com/Person> .
```

<!-- tabs:end -->


This context is accessible via a dedicated `_CONTEXT` query/object in the Staple API schema:


<!-- tabs:start -->

#### **_CONTEXT query**


```graphql
{
  _CONTEXT {
    _id
    _type
    Agent
    Organization
    Person
    name
    age
    revenue
    isMarried
    employee
    customerOf
  }
}
```

#### **_CONTEXT query response**

```javascript
{
  "data": {
    "_CONTEXT": {
      "_id": "@id",
      "_type": "@type",
      "Agent": "http://example.com/Agent",
      "Organization": "http://example.com/Organization",
      "Person": "http://example.com/Person",
      "name": "http://example.com/name",
      "age": "http://example.com/age",
      "revenue": "http://example.com/revenue",
      "isMarried": "http://example.com/isMarried",
      "employee": "http://example.com/employee",
      "customerOf": "http://example.com/customerOf"
    }
  }
}
```

#### **JSON-LD context**

```javascript
{
  "_id": "@id",
  "_type": "@type",
  "Agent": "http://example.com/Agent",
  "Organization": "http://example.com/Organization",
  "Person": "http://example.com/Person",
  "name": "http://example.com/name",
  "age": "http://example.com/age",
  "revenue": "http://example.com/revenue",
  "isMarried": "http://example.com/isMarried",
  "employee": "http://example.com/employee",
  "customerOf": "http://example.com/customerOf"
}
```

<!-- tabs:end -->



## Inheritance / inference

Staple API supports basic type inheritance / inference based on the [standard semantics](https://www.w3.org/TR/rdf11-mt/) of the `rdfs:subClassOf` predicate, described by the following valid inference rules:

?> `instance a A` <br>
`A rdfs:subClassOf B` <br> 
--- <br>
`instance a B`

?> `A rdfs:subClassOf B` <br>
`B rdfs:subClassOf C` <br> 
--- <br>
`A rdfs:subClassOf C`

These rules state that an instance of a class is also an instance of its superclass, and that the subclass hierarachy is transitive. Essentially, this inference mechanism enables to query objects by their implicit (indirect) types, i.e., those that are only inferred from the type hierarchy in the ontology but not explicitly asserted in the input. The following example shows the results of the inference on the query level, assuming the same sample ontology including the statement: `example:Person rdfs:subClassOf example:Agent`:

<!-- tabs:start -->

#### **Person created**

```graphql
mutation {
  Person {
    input: {
      _id: "http://example.com/john"
      name: "John Smith"
    }
  }
}
```

#### **Agent query 1**

Query: 

```graphql
{
  Agent {
    _id
    _type 
    name
  }
}
```

Response:

```javascript
{
  "data": {
    "Agent": [
      ]
  }
}
```

#### **Agent query 2**

Query: 

```graphql
{
  Agent(
    inferred: true
    )  {
          _id
          _type 
          name
        }
}
```

Response:

```javascript
{
  "data": {
    "Agent": [
      {
        "_id": "http://example.com/john",
        "_type": [
          "Person"
        ],
        "name": "John Smith"
      }
    ]
  }
}
```

#### **Agent query 3**

Query: 

```graphql
{
  Agent(
    inferred: true
    )  {
          _id
          _type (inferred: true)
          name
        }
}
```

Response:

```javascript
{
  "data": {
    "Agent": [
      {
        "_id": "http://example.com/john",
        "_type": [
          "Person",
          "Agent"
        ],
        "name": "John Smith"
      }
    ]
  }
}
```

<!-- tabs:end -->


## Data as knowledge graph

A **knowledge graph** is an abstraction of data that views it as a collection of entities (represented as _graph nodes_) connected with relationships (represented as _graph edges_) whose meaning and structure is described via a consistent set of semantic rules and constraints (ontology/schema). For more background see [the reference section](/docs/?id=references).

In Staple API, the structure of client-facing data objects is sanctioned by the GraphQL schema, which in turn, reflects the semantic constraints of the ontology model. While syntactically these objects are plain JSONs, the actual data they convey can be naturally viewed as fragments of a single knowledge graph. This is due to the use of identifers (URIs) unique across the entire dataset and the JSON-LD mechanism, which provides an unambiguous mapping from JSON to RDF. 

Consider several objects representing people and organizations inserted via the following Staple API mutations (we assume the ontology and JSON-LD context of the running example used across this documentation):

```graphql
mutation {
  Person(input: {
    _id: "http://example.com/john"
    name: "John Smith"
    customerOf: [
      "http://example.com/bank"
      "http://example.com/mobile"
    ]
  })
}
```

```graphql
mutation {
  Person(input: {
    _id: "http://example.com/mark"
    name: "Mark Brown"
    customerOf: [
      "http://example.com/bank"
    ]
  })
}
```

```graphql
mutation {
  Organization(input: {
    _id: "http://example.com/bank"
    name: "National Bank"
    employee: [
      "http://example.com/john" 
    ]
  })
}
```
  
```graphql
mutation {
  Organization(input: {
    _id: "http://example.com/mobile"
    name: "Mobile Network Provider"
    employee: [
      "http://example.com/mark" 
    ]
  })
}
```

Various fragments of this data can be then retrieved in multiple ways using different queries, for instance:

```graphql
{
  Organization {
    _id
    _type
    name
    employee {
      _id
      _type
      name
      customerOf {
        _id
      }
    }
  }
}
```

The response to this query should look as follows:
```graphql
{
  "data": {
    "Organization": [
      {
        "_id": "http://example.com/bank",
        "_type": [
          "Organization"
        ],
        "name": "National Bank",
        "employee": [
          {
            "_id": "http://example.com/john",
            "name": "John Smith",
            "customerOf": [
              {
                "_id": "http://example.com/bank" 
              },
              {
                "_id": "http://example.com/mobile"
              }
            ]
          }
        ]
      },
      {
        "_id": "http://example.com/mobile",
        "_type": [
          "Organization"
        ],
        "name": "Mobile Network Provider",
        "employee": [
          {
            "_id": "http://example.com/mark",
            "name": "Mark Brown",
            "customerOf": [
              {
                "_id": "http://example.com/bank" 
              }
            ]
          }
        ]
      }
    ]
  }
}
```

When coupled with [the assumed JSON-LD context](https://tinyurl.com/uovk27s), which disambiguates the data and maps it to a graph structure, the response above is equivalent with the following RDF dataset:

```ntriple
<http://example.com/bank> <http://example.com/employee> <http://example.com/john> .
<http://example.com/bank> <http://example.com/name> "National Bank" .
<http://example.com/bank> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.com/Organization> .
<http://example.com/john> <http://example.com/customerOf> <http://example.com/bank> .
<http://example.com/john> <http://example.com/customerOf> <http://example.com/mobile> .
<http://example.com/john> <http://example.com/name> "John Smith" .
<http://example.com/mark> <http://example.com/customerOf> <http://example.com/bank> .
<http://example.com/mark> <http://example.com/name> "Mark Brown" .
<http://example.com/mobile> <http://example.com/employee> <http://example.com/mark> .
<http://example.com/mobile> <http://example.com/name> "Mobile Network Provider" .
<http://example.com/mobile> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.com/Organization> .
```
This in turn can be visualsed as:
<p align="center">
  <img src="kg-example.png">
</p>


## Using the API

Staple API can be imported as an [npm package](https://www.npmjs.com/package/staple-api) and initiated as follows (see [Getting started](/tutorial/?id=running-a-demo) for working examples), with two parameters: `ontology` and `config` described below:

```javascript
import staple-api

async function StapleDemo() {
    let stapleApi = await staple(ontology, config);
}

StapleDemo()
```

### Ontology parameter

The `ontology` parameter points to the source RDF ontology and it can be specified in two ways:

1. via the local path to the ontology file,
2. or via a string with the ontology.

<!-- tabs:start -->

#### **Ontology file path**

```javascript
let ontology = {
  file: "./ontology.ttl"
  }
```

#### **Ontology string**


```javascript
let ontology = {
  string: `
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
  `
  }
```

<!-- tabs:end -->

### Back-end configuration

Currently the following back-end storage connectors are supported (more to be added soon) (see [Getting started](/tutorial/?id=running-a-demo) for working examples):

1. [graphy.js](http://graphy.link)
2. [MongoDB](https://www.mongodb.com/)
3. [SPARQL endpoint](https://www.w3.org/TR/sparql11-protocol/)

**graphy.js** is a lightweight in memory quad store (graph database for RDF). It is enabled by default and no additional configuration is required to initiate it. It is well-suitted for rapid testing and prototyping. Note that all data inserted to this storage during the runtime is lost on closing the service. 


**MongoDB** is a popular JSON document store available as a stand-alone server or a cloud service ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas)). In order to use Staple API on top of MongoDB a corresponding configuration needs to be passed when initiating the service.


**SPARQL endpoint** is a standard query endpoint exposed by any RDF triple stores, which complies with the [W3C specification](https://www.w3.org/TR/sparql11-protocol/).

<!-- tabs:start -->

#### **graphy.js**


```javascript
import staple-api

let ontology = {
  file: "./ontology.ttl"
  }

async function StapleDemo() {
    let stapleApi = await staple(ontology);
}

StapleDemo()
```

#### **MongoDB**

```javascript
import staple-api

let ontology = {
  file: "./ontology.ttl"
  }

let config = {
    type: "mongodb",
    url: "mongodb://127.0.0.1:27017", 
    dbName: "dbName",
    collectionName: "collectionName",
};

async function StapleDemo() {
    let stapleApi = await staple(ontology, config);
}

StapleDemo()
```
where:
* `type: "mongodb"` is a constant attribute for this connector
* `127.0.0.1:27017` is the `IP:port` of the MongoDB endpoint
* `dbName` is the name of the designated MongoDB database
* `collectionName` is the name of the designated MongoDB collection

#### **SPARQL**

```javascript
import staple-api

let ontology = {
  file: "./ontology.ttl"
  }

let config = {
    type: "sparql",
    url: "http://sparql-query-uri", 
    updateUrl: "http://sparql-update-uri",
    graphName: "http://graph-name"
};

async function StapleDemo() {
    let stapleApi = await staple(ontology, config);
}

StapleDemo()
```
where:
* `type: "sparql"` is a constant attribute for this connector
* `http://sparql-query-uri` is the URL of the SPARQL query endpoint
* `http://sparql-update-uri` is the URL of the SPARQL update query endpoint (usually the same as the one above, but not always)
* `http://graph-name` (optional parameter) name of the target graph in the triple store

<!-- tabs:end -->

### GraphQL service

The main property accessible in the constructed Staple API object is `schema`, which represents a built GraphQL schema, which can be used directly to create, e.g., a GraphQL service or a server:



<!-- tabs:start -->

#### **GraphQL service**

```javascript
const staple = require("staple-api");

let ontology = {
  file: "./ontology.ttl"
  }

async function StapleDemo() {
    let stapleApi = await staple(ontology);  

    stapleApi.graphql('{ _CONTEXT { _id _type Person employee } }').then((response) => {
        console.log(JSON.stringify(response));
      });
}

StapleDemo()
```

#### **GraphQL server**

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

<!-- tabs:end -->

Additionally, JSON-LD context used in the service, which enables mapping of GraphQL responses to RDF, is acessible via the property `context`:

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


## References

For more background reading and documentation see the references below.

#### Knowledge graphs
* [WTF is a Knowledge Graph?](https://hackernoon.com/wtf-is-a-knowledge-graph-a16603a1a25f), Jo Stichbury
* [What is a knowledge graph?](https://www.ontotext.com/knowledgehub/fundamentals/what-is-a-knowledge-graph/), Ontotext
* [AI & Graph Technology: What Are Knowledge Graphs](https://neo4j.com/blog/ai-graph-technology-knowledge-graphs/), Neo4j
* [What is a knowledge graph?](https://www.poolparty.biz/what-is-a-knowledge-graph), Semantic Web Company
* [Knowledge graphs beyond the hype: Getting knowledge in and out of graphs and databases](https://www.zdnet.com/article/knowledge-graphs-beyond-the-hype-getting-knowledge-in-and-out-of-graphs-and-databases/), George Anadiotis
* [Building a knolwedge graph](https://6point6.co.uk/insights/building-a-knowledge-graph/), Daniel Alexander Smith

#### GraphQL

* [GraphQL.js tutorial](https://graphql.org/graphql-js/)

#### JSON-LD

* [JSON-LD 1.0 specification](https://www.w3.org/TR/2014/REC-json-ld-20140116/)
* [JSON-LD playground](https://json-ld.org/playground/)

#### GraphQL + JSON-LD
* [What Can the Semantic Web Do for GraphQL?](https://medium.com/@sklarman/what-the-semantic-web-can-do-for-graphql-8cfb39971714), Szymon Klarman
* [Linked Open Statistical Data, Served Simply](https://medium.com/@sklarman/linked-open-statistical-data-served-simply-ead245bf715), Szymon Klarman