## Ontology and schema

Staple API schemas are generated automatically from RDF ontologies expressed in the [schema.org data model](https://schema.org/docs/datamodel.html) (with slight extensions). This data model includes the following vocabulary elements:


<!-- tabs:start -->

#### **RDF ontology**

| Construct                     | Description                                 |
| ----------------------------- | ------------------------------------------- |
| rdfs:Class                    | An object type                              |
| rdfs:subClassOf               | A subtype of a given type                   |
| rdf:Property                  | A property / attribute                      |                
| owl:FunctionalProperty        | A functional property                       |                   
| rdfs:comment                  | A description of a vocabulary item          |
| schema:domainIncludes         | A possible domain type of a given property  |
| schema:rangeIncludes          | A possible range type of a given property   |

#### **GraphQL schema**


| Construct                     | GraphQL functionality / construct           |
| ----------------------------- | ------------------------------------------- |
| rdfs:Class                    | An object type                              |
| rdfs:subClassOf               | Implicit type inheritance/inference         |
| rdf:Property                  | A field                                     |                
| owl:FunctionalProperty        | A single-valued field                       |                   
| rdfs:comment                  | A description of a construct                |
| schema:domainIncludes         | The domain type on which the field occurs   |
| schema:rangeIncludes          | The value type of the field                 |


<!-- tabs:end -->

### Ontology example

Currently the ontologies accepted by Staple API must be represented in the [RDF Turtle sytnax](https://www.w3.org/TR/turtle/). The following example presents a simple ontology including all supported constructs:


```
@prefix schema: <http://schema.org/> .
@prefix example: <http://example.com/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .

schema:Thing a rdfs:Class ;
    rdfs:comment "Anything." .

schema:Person a rdfs:Class ;
    rdfs:comment "A person" ;
    rdfs:subClassOf schema:Thing .
    
schema:Place a rdfs:Class ;
    rdfs:comment "A place" ;
    rdfs:subClassOf schema:Thing .
    
schema:Text a schema:DataType, rdfs:Class ;
    rdfs:comment "This is text DataType." .
    
schema:name a rdf:Property, owl:FunctionalProperty ;
    schema:domainIncludes schema:Thing ;
    schema:rangeIncludes schema:Text ;
    rdfs:comment "The name of an entity." .
    
schema:birthPlace a rdf:Property, owl:FunctionalProperty ;
    schema:domainIncludes schema:Person ;
    schema:rangeIncludes schema:Place ;
    schema:rangeIncludes schema:Text ;
    rdfs:comment "The birthplace of a the person." .
    
schema:parent a rdf:Property ;
    schema:domainIncludes schema:Person ;
    schema:rangeIncludes schema:Person ;
    schema:inverseOf schema:children ;
    rdfs:comment "A parent of this person." .

schema:children a rdf:Property ;
    schema:domainIncludes schema:Person ;
    schema:rangeIncludes schema:Person ;
    schema:inverseOf schema:parent ;
    rdfs:comment "A child of this person." .
    
```

### Ontology constructs and patterns

Below you can find further explanations of specific ontology constructs and patterns, based on the example above.

---
```
@prefix schema: <http://schema.org/> .
@prefix example: <http://example.com/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
```
The definition of URI prefixes used in the ontology.

---
```
schema:Thing a rdfs:Class ;
    rdfs:comment "Anything." .
```

The definition of the top object type `schema:Thing`. Every entity in the domain is either a direct or indirect instance of `schema:Thing`.

---
```
schema:Place a rdfs:Class ;
    rdfs:comment "A place" ;
    rdfs:subClassOf schema:Thing .
```
The definition of the object type `schema:Place`, which is a subtype of `schema:Thing`. This means that every entity of type `schema:Place` is indirectly an instance of `schema:Thing`. 

---
```
schema:Text a schema:DataType, rdfs:Class ;
    rdfs:comment "This is text DataType." .
```

The definition of the data type `schema:Text`. 

---
```
schema:name a rdf:Property, owl:FunctionalProperty ;
    schema:domainIncludes schema:Thing ;
    schema:rangeIncludes schema:Text ;
    rdfs:comment "The name of an entity." .
```

The definition of the property `schema:name`. It is declared to be a functional property, meaning that any entity can have at most one value of that property. The domain of `schema:name` includes `schema:Thing`, which means that any (direct or indirect) instance of that type can have this property. The range includes `schema:Text`, meaning that the values of `schema:name` are of type `schema:Text`. 

---
```
schema:birthPlace a rdf:Property, owl:FunctionalProperty ;
    schema:domainIncludes schema:Person ;
    schema:rangeIncludes schema:Place ;
    schema:rangeIncludes schema:Text ;
    rdfs:comment "The birthplace of a the person." .
```
The definition of the property `schema:birthPlace`. Only instances of `schema:Person` can have this property, while its values can be either objects of type `schema:Place` or literal values of type `schema:Text`. 

---
```
schema:parent a rdf:Property ;
    schema:domainIncludes schema:Person ;
    schema:rangeIncludes schema:Person ;
    schema:inverseOf schema:children ;
    rdfs:comment "The husband of this person." .
``` 
The definition of the property `schema:parent`. This property is defined as the inverse of `schema:children`, meaning that whenever person X is the value of `schema:parent` for entity Y, it can be inferred that Y is a value of `schema:children` for person X. 

    
### URIs 

The URIs aff all types and properties used in the ontology can be arbtirary provided that their local name part (after the last `/` or `#` symbol in the URI):
* is unique across the ontology;
* is a valid GraphQL schema name (matching the regex: `/[_A-Za-z][_0-9A-Za-z]*/`).


### GraphQL schema

The RDF ontology is automatically mapped to the corresponding GraphQL schema, following the patterns described below.

---

Every object type (e.g., `Person`) is mapped to a GraphQL type of the same name with fields corrsponding to properties with the matching domain types (see below) and three special ones: 
* `_id` - corresponding to JSON-LD's `@id`, holding the URI of each instance);
* `_type` - corresponding to JSON-LD's `@type`, holding the types of each instance);


```
type Person {
    _id: ID!
    _type: [String]
    ...
}
```

--- 
Every data type (e.g., `Text`) is mapped to a GraphQL type of the same name with three special fields: 
* `_value` - corresponding to JSON-LD's `@value`, holding the literal value of this data item;
* `_type` - corresponding to JSON-LD's `@type`, holding the data types of this item.
```
type Text {
    _value: String!
    _type: [String]
}
```

---
Every property (e.g., `name`, `parent` or `birthPlace`) is mapped to fields of the same names on matching object types (the explicit types declared via `schema:domainIncludes` predicate and their subtypes declared by `rdfs:subClassOf`). The range of the fields is determined by two components:
* the `schema:rangeIncludes` declarations (single type `field: Type` vs. union types `field: Type-1_v_..._v_Type-n`, depending on the number of declared types in the range); 
* by the `owl:FunctionalProperty` declarations on the properties (single values `field: Type` when declaration is present; multiple values `field: [Type]` when the declaration is missing)

```
type Person {
    name: Text
    parent: [Person]
    birthPlace: _Text_v_Place_
    ...
}

union _Text_v_Place_ = Text | Place
```
---
Finally, all object types and fields give rise to GraphQL queries, mutations and input objects for mutations, of matching names and structures. 

```
query Person(page: Int) : [Person]
```

```
muation Person(type: MutationType!, input: InputPerson!) : Boolean
```

```
input InputPerson {
    _id: ID!
    _type: [String]
    name: ...
}
```

### JSON-LD context

All type and property URIs used in the ontology and the additional special fields included in the GraphQL schema are automatically mapped to a basic [JSON-LD context](https://json-ld.org/spec/latest/json-ld/#the-context) of the following structure:

```json
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

```ntriple
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

## Query

By default the Staple API exposes three types of queries: 

1. Object queries corresponding to object types.
2. Special _CONTEXT query returning URIs of selected vocabulary items. 
3. Special _OBJECT query returning all objects created via the Staple API.



### Object type queries

Each object type in the schema has a unique corresponding query of the same name and a fixed structure. For instance, instances of the type `Person` can be requested with the query:

```
query Person(page: Int) : [Person]
```

These are standard GraphQL queries deterimned be the structure of the schema. For instance:

```javascript

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

```
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



### _context

This query field returns a unique `_context_` object, which represents the expanded JSON-LD context that is assumed in the Staple API instance:

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


```
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

```
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

```
{
  Thing {
    _id
  }
}
```

```
{
  "data": {
    "Thing": [
    ]
  }
}
```


---
With inference:

```
{
  Thing(inferred:true) {
    _id
  }
}
```

```
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
