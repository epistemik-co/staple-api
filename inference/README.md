# Inference

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