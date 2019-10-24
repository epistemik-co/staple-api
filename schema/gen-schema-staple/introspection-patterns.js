const ID = "_id"
const VALUE = "_value"
const TYPE = "_type"
const REVERSE = "_reverse"
const INPUT = "_INPUT"
const TYPES = "_TYPES"
const CONTEXT = "_CONTEXT"
const UNION = "_v_"
const OBJECT = "_OBJECT"
const OBJECT_TYPES = "_OBJECT_TYPES"
const DATATYPES = "_DATATYPES"
const REV = "_REV"

// get names

function getTypesName(name) {
  return name + TYPES
}

function getRangeName(typeNames) {
  return typeNames.sort().join(UNION)
}

function getTypeRangeName(range) {
  return "_" + range.sort().join("_v_") + "_"
}

function getInputName(name) {
  return name + INPUT
}

function getReverseTypeName(name) {
  return name + REV
}



// get special JSON-LD fields

function getIdQueryField() {
  return {
    "name": ID,
    "description": "The URI identfier of the object.",
    "args": [
      {
        "name": "only",
        "description": "The URI must be on the provided list of URIs.",
        "type": {
          "kind": "LIST",
          "name": null,
          "ofType": {
            "kind": "SCALAR",
            "name": "String",
            "ofType": null
          }
        },
        "defaultValue": null
      }
    ],
    "type": {
      "kind": "NON_NULL",
      "name": null,
      "ofType": {
        "kind": "SCALAR",
        "name": "ID",
        "ofType": null
      }
    }
  }
}

function getReverseQueryField(typeName) {

  return {
    "name": REVERSE,
    "description": "The inverse view of the object of type: " + typeName + ".",
    "args": [],
    "type": {
      "kind": "OBJECT",
      "name": getReverseTypeName(typeName),
      "ofType": null
    }
  }
}

function getValueQueryField() {
  return {
    "name": VALUE,
    "description": "The literal data value for the property.",
    "args": [
      {
        "name": "only",
        "description": "The value of this property must be on the provided list.",
        "type": {
          "kind": "LIST",
          "name": null,
          "ofType": {
            "kind": "SCALAR",
            "name": "String",
            "ofType": null
          }
        },
        "defaultValue": null
      },
      {
        "name": "contains",
        "description": "The value of the property must contain the specified string.",
        "type": {
          "kind": "SCALAR",
          "name": "String",
          "ofType": null
        },
        "defaultValue": null
      },
      {
        "name": "lang",
        "description": "The language of the string value (if recognized).",
        "type": {
          "kind": "SCALAR",
          "name": "String",
          "ofType": null
        },
        "defaultValue": null
      }
    ],
    "type": {
      "kind": "SCALAR",
      "name": "String",
      "ofType": null
    }
  }
}

function getTypeQueryField() {
  return {
    "name": TYPE,
    "description": "Types of the object.",
    "args": [
      {
        "name": "inferred",
        "description": "Include inferred types for this object.",
        "type": {
          "kind": "SCALAR",
          "name": "Boolean",
          "ofType": null
        },
        "defaultValue": "false"
      }
    ],
    "type": {
      "kind": "LIST",
      "name": null,
      "ofType": {
        "kind": "SCALAR",
        "name": "String",
        "ofType": null
      }
    }
  }
}

function getTypeDatatypeQueryField() {
  return {
    "name": TYPE,
    "description": "Asserted data type of this value.",
    "args": [],
    "type": {
      "kind": "LIST",
      "name": null,
      "ofType": {
        "kind": "SCALAR",
        "name": "String",
        "ofType": null
      }
    }
  }
}

function getBothtIdValueInputFields() {
  return [
    {
      "name": ID,
      "description": "The URI identfier of the object.",
      "type": {
        "kind": "SCALAR",
        "name": "ID",
        "ofType": null
      },
      "defaultValue": null
    },
    {
      "name": VALUE,
      "description": "The literal data value of the property.",
      "type": {
        "kind": "SCALAR",
        "name": "String",
        "ofType": null
      },
      "defaultValue": null
    }
  ]
}

function getTypeInputField() {
  return {
    "name": TYPE,
    "description": "Types of the object.",
    "type": {
      "kind": "LIST",
      "name": null,
      "ofType": {
        "kind": "ENUM",
        "name": OBJECT_TYPES,
        "ofType": null
      }
    },
    "defaultValue": null
  }
}

function getIdInputField() {
  return {
    "name": ID,
    "description": "The URI identfier of the object.",
    "type": {
      "kind": "NON_NULL",
      "name": null,
      "ofType": {
        "kind": "SCALAR",
        "name": "ID",
        "ofType": null
      }
    },
    "defaultValue": null
  }
}

function getValueInputField() {
  return {
    "name": VALUE,
    "description": "The literal data value of the property.",
    "type": {
      "kind": "NON_NULL",
      "name": null,
      "ofType": {
        "kind": "SCALAR",
        "name": "String",
        "ofType": null
      }
    },
    "defaultValue": null
  }
}


// get top schema

function getSchemaObject(types, readonly) {

  types = types.concat(getGQLScalars())

  if (!readonly) {
    types.push(
      getMutationEnum()
    )
  }

  var schemaObject = {
    "__schema": {
      "queryType": {
        "name": "Query"
      },
      "types": types
    }
  }

  if (!readonly) {
    schemaObject["__schema"]["mutationType"] = {
      "name": "Mutation"
    }
  }

  return schemaObject

}

// get scalars

function getGQLScalars() {
  return [
    {
      "kind": "SCALAR",
      "name": "String",
      "description": "The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.",
      "fields": null,
      "inputFields": null,
      "interfaces": null,
      "enumValues": null,
      "possibleTypes": null
    },
    {
      "kind": "SCALAR",
      "name": "Int",
      "description": "The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. ",
      "fields": null,
      "inputFields": null,
      "interfaces": null,
      "enumValues": null,
      "possibleTypes": null
    },
    {
      "kind": "SCALAR",
      "name": "ID",
      "description": "The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `\"4\"`) or integer (such as `4`) input value will be accepted as an ID.",
      "fields": null,
      "inputFields": null,
      "interfaces": null,
      "enumValues": null,
      "possibleTypes": null
    },
    {
      "kind": "SCALAR",
      "name": "Boolean",
      "description": "The `Boolean` scalar type represents `true` or `false`.",
      "fields": null,
      "inputFields": null,
      "interfaces": null,
      "enumValues": null,
      "possibleTypes": null
    }
  ]
}

// get rest...

function getMutationEnum() {
  return {
    "kind": "ENUM",
    "name": "MutationType",
    "description": null,
    "fields": null,
    "inputFields": null,
    "interfaces": [],
    "enumValues": [
      {
        "name": "INSERT",
        "description": "Add specified data about an object, provided the object exists and the data is consistent with the current knowledge base."
      },
      {
        "name": "REMOVE",
        "description": "Remove all specified data from the current knowledge base."
      },
      {
        "name": "UPDATE",
        "description": "Replace the existing object with its new version specified in the input."
      }
    ],
    "possibleTypes": null
  }
}

function getObjectTypeValue(name) {
  return {
    "name": name,
    "description": null
  }
}

function getObjectTypesEnum(typeNames) {
  var values = typeNames.sort().map(getObjectTypeValue)

  return {
    "kind": "ENUM",
    "name": OBJECT_TYPES,
    "description": "All object types in the schema.",
    "fields": null,
    "inputFields": null,
    "interfaces": [],
    "enumValues": values,
    "possibleTypes": null
  }
}

function getDataTypesEnum(typeNames) {
  var values = typeNames.sort().map(getObjectTypeValue)

  return {
    "kind": "ENUM",
    "name": DATATYPES,
    "description": "All datatypes in the schema.",
    "fields": null,
    "inputFields": null,
    "interfaces": [],
    "enumValues": values,
    "possibleTypes": null
  }
}

function getQueryType(typeNames) {
  var fields = typeNames.map(getQueryField)

  queryFields = [{
    "name": CONTEXT,
    "description": "The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema.",
    "args": [],
    "type": {
      "kind": "OBJECT",
      "name": CONTEXT,
      "ofType": null
    }
  }
  ]
  queryFields.push(getObjectQueryField())
  queryFields = queryFields.concat(fields)

  return {
    "kind": "OBJECT",
    "name": "Query",
    "description": "Get objects of specific types.",
    "fields": queryFields,
    "inputFields": null,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
  }

}

function getObjectQueryField() {
  return {
    "name": OBJECT,
    "description": "List all objects in the database.",
    "args": [
      {
        "name": "page",
        "description": "The number of the consecutive results page to be returned by the query.",
        "type": {
          "kind": "SCALAR",
          "name": "Int",
          "ofType": null
        },
        "defaultValue": "1"
      }
    ],
    "type": {
      "kind": "LIST",
      "name": null,
      "ofType": {
        "kind": "OBJECT",
        "name": OBJECT,
        "ofType": null
      }
    }
  }
}

function getQueryField(typeName) {
  return {
    "name": typeName,
    "description": "List objects of type: " + typeName + ".",
    "args": [
      {
        "name": "page",
        "description": "The number of the consecutive results page to be returned by the query.",
        "type": {
          "kind": "SCALAR",
          "name": "Int",
          "ofType": null
        },
        "defaultValue": "1"
      },
      {
        "name": "inferred",
        "description": "Include inferred objects of this type.",
        "type": {
          "kind": "SCALAR",
          "name": "Boolean",
          "ofType": null
        },
        "defaultValue": "false"
      }
    ],
    "type": {
      "kind": "LIST",
      "name": null,
      "ofType": {
        "kind": "OBJECT",
        "name": typeName,
        "ofType": null
      }
    }
  }
}

function getContextField(key, uri) {
  return {
    "name": key,
    "description": uri,
    "args": [],
    "type": {
      "kind": "SCALAR",
      "name": "String",
      "ofType": null
    }
  }
}

function getObjectObject() {
  var fields = []
  fields.push(getIdQueryField())
  fields.push(getTypeQueryField())

  return {
    "kind": "OBJECT",
    "name": OBJECT,
    "description": "Any object in the database.",
    "fields": fields,
    "inputFields": null,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
  }

}

function getContextObject(context) {
  var fields = []
  for (var key in context) {
    fields.push(getContextField(key, context[key]))
  }

  return {
    "kind": "OBJECT",
    "name": CONTEXT,
    "description": "Exposes linked data context mapppings for this schema. Response to the full " + CONTEXT + " query returns a valid JSON-LD context sufficient to interpret data returned by other queries and inserted via mutations.",
    "fields": fields,
    "inputFields": null,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
  }
}

function getMutationType(typeNames) {

  var mutationFields = [
    {
      "name": "CREATE",
      "description": "Creates a new object with the provided ID.",
      "args": [
        {
          "name": "id",
          "description": "A valid, new URI for the created object.",
          "type": {
            "kind": "NON_NULL",
            "name": null,
            "ofType": {
              "kind": "SCALAR",
              "name": "ID",
              "ofType": null
            }
          },
          "defaultValue": null
        }
      ],
      "type": {
        "kind": "SCALAR",
        "name": "Boolean",
        "ofType": null
      }
    },
    {
      "name": "DELETE",
      "description": "Deletes an existing object by the provided ID (including all data about it).",
      "args": [
        {
          "name": "id",
          "description": "A valid URI of an existing object",
          "type": {
            "kind": "NON_NULL",
            "name": null,
            "ofType": {
              "kind": "SCALAR",
              "name": "ID",
              "ofType": null
            }
          },
          "defaultValue": null
        }
      ],
      "type": {
        "kind": "SCALAR",
        "name": "Boolean",
        "ofType": null
      }
    }
  ]
  var fields = typeNames.map(getMutationField)
  mutationFields = mutationFields.concat(fields)

  return {
    "kind": "OBJECT",
    "name": "Mutation",
    "description": "CRUD operations over objects of specifc types.",
    "fields": mutationFields,
    "inputFields": null,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
  }
}

function getMutationField(fieldName) {

  var inputName = fieldName + INPUT

  return {
    "name": fieldName,
    "description": "Perform mutation over an object of type: " + fieldName + ".",
    "args": [
      {
        "name": "type",
        "description": "The type of the mutation to be applied.",
        "type": {
          "kind": "NON_NULL",
          "name": null,
          "ofType": {
            "kind": "ENUM",
            "name": "MutationType",
            "ofType": null
          }
        },
        "defaultValue": null
      },
      {
        "name": "ensureExists",
        "description": "Throw error (instead of a warning) in case the object does not exist prior to the mutation.",
        "type": {
          "kind": "SCALAR",
          "name": "Boolean",
          "ofType": null
        },
        "defaultValue": false
      },
      {
        "name": "input",
        "description": "The input object of the mutation.",
        "type": {
          "kind": "NON_NULL",
          "name": null,
          "ofType": {
            "kind": "INPUT_OBJECT",
            "name": inputName,
            "ofType": null
          }
        },
        "defaultValue": null
      }
    ],
    "type": {
      "kind": "SCALAR",
      "name": "Boolean",
      "ofType": null
    }
  }
}

function getObjectType(name, description, fields, entails, includeReverse) {

  fields.push(getIdQueryField())
  fields.push(getTypeQueryField())
  if (includeReverse) {
    fields.push(getReverseQueryField(name))
  }
  if (entails.length > 0) {
    description = description + "\n\nBroader types: " + entails.join(", ")
  }
  return {
    "kind": "OBJECT",
    "name": name,
    "description": description,
    "fields": fields,
    "inputFields": null,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
  }
}

function getObjectReverseType(name, fields) {


  var description = "This is the inverse view of the object of type: " + name + ". \n\n This means, that whenever the schema contains the structure SomeType { someField: " + name + " } it will also be the case that " + getReverseTypeName(name) + "{ someField: SomeType }."


  return {
    "kind": "OBJECT",
    "name": getReverseTypeName(name),
    "description": description,
    "fields": fields,
    "inputFields": null,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
  }
}


function getDataType(name, description, entails) {

  var fields = []
  fields.push(getValueQueryField())
  fields.push(getTypeDatatypeQueryField())
  if (entails.length > 0) {
    description = description + "\n\nBroader types: " + entails.join(", ")
  }

  return {
    "kind": "OBJECT",
    "name": name,
    "description": description,
    "fields": fields,
    "inputFields": null,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
  }

}

function getUnionType(typeNames) {

  var possibleTypes = typeNames.map(getPossibleType)

  var name = getRangeName(typeNames)

  var description = "A filler of any of the types: " + typeNames.sort().join(", ") + "."

  return {
    "kind": "UNION",
    "name": name,
    "description": description,
    "fields": null,
    "inputFields": null,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": possibleTypes
  }
}

function getPossibleType(name) {
  return {
    "kind": "OBJECT",
    "name": name,
    "ofType": null
  }
}

function getEnumValue(type) {
  return {
    "name": type,
    "description": null
  }
}

function getEnumType(types) {

  var typeName = getTypeRangeName(types)
  var enumValues = types.map(getEnumValue)

  return {
    "kind": "ENUM",
    "name": typeName,
    "description": null,
    "fields": null,
    "inputFields": null,
    "interfaces": [],
    "enumValues": enumValues,
    "possibleTypes": null
  }
}

function getEnumSchemaType(name, description, instances) {

  var enumValues = instances.map(getEnumValue)

  return {
    "kind": "ENUM",
    "name": name,
    "description": description,
    "fields": null,
    "inputFields": null,
    "interfaces": [],
    "enumValues": enumValues,
    "possibleTypes": null
  }
}

function getListField(name, description, targetType, isReverse) {

  if (isReverse) {
    description = "This is the inverse view of the property: " + name + ". \n\nThis means that whenever it is the case that { x { "+ name + " { y } } it implies { y { _reverse { "+ name + " { x } } }."
  }

  return {
    "name": name,
    "description": description,
    "args": [],
    "type": {
      "kind": "LIST",
      "name": null,
      "ofType": {
        "kind": "OBJECT",
        "name": targetType,
        "ofType": null
      }
    }
  }
}

function getSingleField(name, description, targetType, isReverse) {

  if (isReverse) {
    description = description + " (this is a reverse view of the property: " + name + ")"
  }
  return {
    "name": name,
    "description": description,
    "args": [],
    "type": {
      "kind": "OBJECT",
      "name": targetType,
      "ofType": null
    }
  }
}

function getTypeRangeField(range) {
  return {
    "name": TYPE,
    "description": "The type of the property filler.",
    "type": {
      "kind": "ENUM",
      "name": getTypeRangeName(range),
      "ofType": null
    },
    "defaultValue": null
  }
}


function getInputObjectType(name, description, fieldTypes, entails) {
  var fields = []

  fields = fields.concat(fieldTypes)
  fields.push(getIdInputField())
  fields.push(getTypeInputField())
  if (entails.length > 0) {
    description = description + "\n\nBroader types: " + entails.join(", ")
  }
  return {
    "kind": "INPUT_OBJECT",
    "name": getInputName(name),
    "description": description,
    "fields": null,
    "inputFields": fields,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
  }

}

function getInputRangeType(name, id, value, range) {

  var fields = [
    getTypeRangeField(range)
  ]

  if (id && value) {
    fields = fields.concat(getBothtIdValueInputFields())
  } else {

    if (id) {
      fields.push(
        getIdInputField()
      )
    }

    if (value) {
      fields.push(
        getValueInputField()
      )
    }

  }

  return {
    "kind": "INPUT_OBJECT",
    "name": getInputName(name),
    "description": "The filler for the property " + name,
    "fields": null,
    "inputFields": fields,
    "interfaces": [],
    "enumValues": null,
    "possibleTypes": null
  }
}

function getInputListField(name, description) {

  return {
    "name": name,
    "description": description,
    "type": {
      "kind": "LIST",
      "name": null,
      "ofType": {
        "kind": "INPUT_OBJECT",
        "name": getInputName(name),
        "ofType": null
      }
    },
    "defaultValue": null
  }
}

function getInputSingleField(name, description) {

  return {
    "name": name,
    "description": description,
    "type": {
      "kind": "INPUT_OBJECT",
      "name": getInputName(name),
      "ofType": null
    },
    "defaultValue": null
  }
}

module.exports = {
  getObjectType,
  getObjectReverseType,
  getInputSingleField,
  getInputListField,
  getInputName,
  getUnionType,
  getInputObjectType,
  getInputRangeType,
  getEnumType,
  getEnumSchemaType,
  getTypesName,
  getListField,
  getSingleField,
  getDataType,
  getSchemaObject,
  getObjectTypesEnum,
  getDataTypesEnum,
  getQueryType,
  getMutationType,
  getContextObject,
  getObjectObject,
  getRangeName,
  getReverseTypeName
}