# Mutations

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


# CREATE 

For an object `URI`, explicitly creates that object in the database (see also [_OBJECT query](https://github.com/epistemik-co/staple-api-docs/tree/master/query#_object) section)

For instance:
```javascript
CREATE(id: "http://example.com/elisabeth")
```

### (V) Validation rules

> `[ERROR]` The object cannot exist in the database prior to this request.

Returns true only if successfully added the triple. 

# DELETE 

For an object `URI`, removes all quads `URI ?p ?o` and `?s ?p URI` from the datatbase.

For instance:
```javascript
DELETE(id: "http://example.com/elisabeth")
```

### (V) Validation rules

> `[ERROR]` The object must exist in the database prior to this request.

Returns true only if successfully removed all triples. 


# Types-specific mutations

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


# Input objects

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

### (V) Validation rules

> [GRAPHQL-ERROR] the depth of the json object is at most 1 (where 0 is a flat key-value map, and 1 is a key-value map, where some values might also be key-value maps or arrays of key-value maps)

> [GRAPHQL-ERROR] the key-value maps on level 1, might only be of one of the two possible forms specified below.

### Acceptable forms of the key-value maps on level 1

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

### (V) Validation rules

> `[ERROR]` the input object is a valid flattened JSON-LD object under the assumed context

> `[ERROR]` the value of all `_id` keys in the object are valid URIs

> `[ERROR]` **IF** datatypes are associated with some additional validators, these has to be positively verified on the provided values.

### Conversion to quads
In the following, by `RDF(input)` we denote the set of triples obtained by converting the input object, under the associated context, into a set of N-Quads.

# INSERT

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


### (V) Validation rules

> `[GRAPHQL-ERROR]` only properties present in the given type should be present.

> `[ERROR]` single-valued fields accept at most one value.

> `[WARNING]` the values in the fields must (ultimately) match the declared target types of these fields (e.g., `http://example.com/elisabeth` must eventually be a `Person`)

> `[ERROR]` all objects mentioned in the input object must exist prior to this request whenever `ensureExists=true`. 




<!-- ### Action
> Insert `RDF(input)` into the database. 

> Assert the root object as the instance of the type corresponding to the mutation by default (e.g.: `http://data/bluesB a schema:Organization`).

> Create all objects (URIs used as values of `_id`) in the input object whenever they do not exist (and `ensureExists=false`). 

> Recompute the inferred types (see [/inference](/inference)) -->


# REMOVE

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


### (V) Validation rules

> `[GRAPHQL-ERROR]` only properties present in the given type should be present.

> `[WARNING]` each object must have at least one type.

> `[WARNING]` fields with mandatory properties must (ultimately) have a value.

> `[ERROR]` all objects mentioned in the input object must exist prior to this request whenever `ensureExists=true`. 

<!-- 
### Action
> Remove `RDF(input)` from the database.
 -->

# UPDATE

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

### (V) Validation rules

> `[ERROR]` all objects mentioned in the input object must exist prior to this request whenever `ensureExists=true`. 

<!-- 

### Action

Removes all and only quads `URI ?p ?o` from the datatbase (except for when `?p == "http://schema-api.org/datamodel/type"`), and inserts the input object. -->
