# Ontology and schema

Staple API schemas are generated automatically from RDF ontologies expressed in the [schema.org data model](https://schema.org/docs/datamodel.html) (with slight extensions). This data model includes the following vocabulary elements:

```
| Vocabulary                    | Description                                 |
|-------------------------------|---------------------------------------------|
| rdfs:Class                    | An object type.                             |
| schema:DataType               | A data type.                                |
| schema:Thing                  | Top object type.                            |
| rdfs:subClassOf               | A subtype of a given type.                  |
| rdf:Property                  | A property / attribute.                     |
| owl:FunctionalProperty        | A functional property.                      |
| rdfs:comment                  | A description of a vocabulary item.         |
| schema:domainIncludes         | A possible domain type of a given property. |
| schema:rangeIncludes          | A possible range type of a given property.  |
| schema:inverseOf              | An inverse property of a given property.    |
|-----------------------------------------------------------------------------|
```

## Ontology example

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

## Ontology constructs and patterns

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

    
## URIs 

The URIs aff all types and properties used in the ontology can be arbtirary provided that their local name part (after the last `/` or `#` symbol in the URI):
* is unique across the ontology;
* is a valid GraphQL schema name (matching the regex: `/[_A-Za-z][_0-9A-Za-z]*/`).


## GraphQL schema

The RDF ontology is automatically mapped to the corresponding GraphQL schema, following the patterns described below.

---

Every object type (e.g., `Person`) is mapped to a GraphQL type of the same name with fields corrsponding to properties with the matching domain types (see below) and three special ones: 
* `_id` - corresponding to JSON-LD's `@id`, holding the URI of each instance);
* `_type` - corresponding to JSON-LD's `@type`, holding the types of each instance);
* `_reverse` - corresponding to JSON-LD's `@reverse`, enabling exploration of incoming properties, i.e., properties on other objects whose value is this instance), e.g.


```
type Person {
    _id: ID!
    _type: [String]
    _reverse: Person_REV
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

## JSON-LD context

All type and property URIs used in the ontology and the additional special fields included in the GraphQL schema are automatically mapped to a basic [JSON-LD context](https://json-ld.org/spec/latest/json-ld/#the-context) of the following structure:

```json
{
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
This context is served via a dedicated `_CONTEXT` query in the Staple API schema and can be used to interepret every Staple API query response and input objects as valid JSON-LD objects (see [data](./data) section)



