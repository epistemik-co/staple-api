# Query

By default the Staple API exposes three types of queries: 

1. Object queries corresponding to object types.
2. Special _CONTEXT query returning URIs of selected vocabulary items. 
3. Special _OBJECT query returning all objects created via the Staple API.



# Object type queries

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


# _reverse

The `_reverse` field present on some object types corresponds to the JSON-LD keyword `@reverse` and is a JSON-LD mechanism of traversing the underlying RDF graph in the reverse direction of the predicates, i.e., from the (named) object to the subject. 

In the following JSON-LD object the `_@_reverse` keyword is used to link a `Place` to a `Person` via the (reverse of) the `birthplace` predicate:

```javascript
{
  "_id": "http://example.com/uk",
  "_type": "Place",
  "_reverse": {
    "birthPlace": {
        "_id": "http://example.com/elisabeth",
        "_type": "Person"
      
    }
  }
}
```

This becomes apparent when the object is converted into the flattened JSON-LD format:

```javascript
{
  "@context": {
    "_id": "@id",
    "_type": "@type",
    "_reverse": "@reverse",
    "birthPlace": "http://schema.org/birthPlace",
    "Person": "http://schema.org/Person",
    "Place": "http://schema.org/Place"
  },
  "@graph": [
    {
      "_id": "http://example.com/elisabeth",
      "_type": "Person",
      "birthPlace": {
        "_id": "http://example.com/uk"
      }
    },
    {
      "_id": "http://example.com/uk",
      "_type": "Place"
    }
  ]
}
```

or to the N-Triple format:

```
<http://example.com/elisabeth> <http://schema.org/birthPlace> <http://example.com/uk> .
<http://example.com/elisabeth> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .
<http://example.com/uk> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Place> .
```

To support reverses the GraphQL schema is automatically extended with object types of the form `Type_REV`, which capture possible reverse relations to objects of certain types, as for instance type `Place_REV` (implicitly queried above) in this schema:


```
type Person {
  _id: ID!
  _type: [String]
  birthPlace: _Text_v_Place_
  name: Text
}

union _Text_v_Place_ = Text | Place

type Text {
  _value: String 
  _type: [String]
}

type Place {
  _id: ID!
  _type: [String]
  _reverse: Place_REV
  name: Text
}

type Place_REV {
  birthPlace: [Person]
}
```

### _CONTEXT

This query field returns a unique `_CONTEXT` object, which represents the expanded JSON-LD context that is assumed in the Staple API instance:

```javascript
  _id: String
  _value: String
  _type: String
  _reverse: String
  Thing: String
  Person: String
  Place: String
  Text: String
  name: String
  birthPlace: String
  parent: String
  children: String
```

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



# _OBJECT

This query field returns a (paginated) list of all objects currently stored in the database with the fixed two fields: 

1. `_id`: the URI identfier of the object
2. `_type`: the known types of the object

For instance:

```
{
  _OBJECT {
    _id
    _type
  }
}
```

Response:

```
{
  "data": {
    "_OBJECT": [
      {
        "_id": "http://example.com/elisabeth",
        "_type": "Person",
      },
      {
        "_id": "http://example.com/uk",
        "_type": "Place"
      },
      ...
    ]
  }
}
```

<!-- The root resolver for this field should return all subjects of the following query over the database:

```
URI <http://staple-api.org/datamodel/type> <http://schema.org/Thing>
```

**Note**: that this dedicated quad template will be consistently used to keep track of the existence of all objects in the database (inserted on creation and removed on deletion of the object - see the [/mutations](/mutations) section). Hence we say that an object `URI` exists in the database **if and only if** the triple above is present in the database.  -->