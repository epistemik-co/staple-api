const DatabaseInterface = require("./database/Database");
const database = new DatabaseInterface();
var express = require("express");
var graphqlHTTP = require("express-graphql");
var graphql = require("graphql");

//map of GraphQLObjectTypes and GraphQLInputObjectTypes

var gqlObjects = {};

var scalarTypes = ["http://www.w3.org/2001/XMLSchema#string",
  "http://www.w3.org/2001/XMLSchema#integer",
  "http://www.w3.org/2001/XMLSchema#boolean",
  "http://www.w3.org/2001/XMLSchema#decimal"];

/**
 * Create classList creates all helper class lists later used to create queryType and mutationType
 * @param  {String} filename name of ontology file
 */

/**
 * Remove namespace removes namespace prefixes
 * @param  {String} nameWithNamesapace 
 */

function removeNamespace(nameWithNamesapace) {
  nameWithNamesapace = nameWithNamesapace.split(["/"]);
  nameWithNamesapace = nameWithNamesapace[nameWithNamesapace.length - 1];
  nameWithNamesapace = nameWithNamesapace.split(["#"]);
  nameWithNamesapace = nameWithNamesapace[nameWithNamesapace.length - 1];
  return nameWithNamesapace;
}

async function createClassList(filename = "test.ttl") {

  //load file to in-memory graphy.js database 

  await database.readFromFile(filename);
  const classes = database.getInstances("http://www.w3.org/2000/01/rdf-schema#Class");
  const subClasses = database.getAllSubs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
  const superiorClasses = database.getAllObjs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
  const domainIncludes = database.getAllObjs("http://schema.org/domainIncludes");
  const rangeIncludes = database.getAllObjs("http://schema.org/rangeIncludes");
  const dataTypes = database.getInstances("http://schema.org/DataType");
  const propertiesInstances = database.getInstances("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property");
  const propertiesDomainIncludes = database.getAllSubs("http://schema.org/domainIncludes");
  const propertiesRangeIncludes = database.getAllSubs("http://schema.org/rangeIncludes");
  const functionalProperties = database.getInstances("http://www.w3.org/2002/07/owl#FunctionalProperty");
  const inverseFunctionalProperties = database.getInstances("http://www.w3.org/2002/07/owl#InverseFunctionalProperty");

  //list of all classes

  let classesSet = [...new Set([...classes, ...subClasses, ...superiorClasses, ...domainIncludes, ...rangeIncludes, ...dataTypes, ...rangeIncludes])];
  classesSet = classesSet.filter(item => item !== "http://www.w3.org/2000/01/rdf-schema#Class" && item !== "http://schema.org/Enumeration");

  //list of all properties

  let properties = [...new Set([...propertiesInstances, ...propertiesDomainIncludes, ...propertiesRangeIncludes, ...functionalProperties, ...inverseFunctionalProperties])];

  //helper objects initialisation

  var classList = {};
  var inputClassList = {};
  var filterClassList = {};

  //filling the helper objects with hierarchy of classes and properties

  for (var propertyIter in properties) {
    var nameOfProperty = removeNamespace(properties[propertyIter]);
    var domains = database.getObjs(properties[propertyIter], "http://schema.org/domainIncludes");
    var ranges = database.getObjs(properties[propertyIter], "http://schema.org/rangeIncludes");
    for (var domainIter in domains) {
      var domainName = removeNamespace(domains[domainIter]);
      if (!(domainName in classList
      )) {
        classList[[domainName]] = { "name": domainName, "fields": {} };
        inputClassList[["Input" + domainName]] = { "name": "Input" + domainName, "fields": {} };
        filterClassList[["Filter" + domainName]] = { "name": "Filter" + domainName, "fields": {} };
      }

      try {
        ranges = ranges.map(r => removeNamespace(r));
        var inputRanges = ranges.map(r => "Input" + removeNamespace(r));
      } catch (error) {
        console.log(ranges);
      }

      for (var r in ranges) {
        if (ranges[r] == "integer") {
          ranges[r] = graphql.GraphQLInt;
          inputRanges[r] = graphql.GraphQLInt;
        } else if (ranges[r] == "string") {
          ranges[r] = graphql.GraphQLString;
          inputRanges[r] = graphql.GraphQLString;
        } else if (ranges[r] == "boolean") {
          ranges[r] = graphql.GraphQLBoolean;
          inputRanges[r] = graphql.GraphQLBoolean;
        } else if (ranges[r] == "decimal") {
          ranges[r] = graphql.GraphQLFloat;
          inputRanges[r] = graphql.GraphQLFloat;
        }
      }
      classList[[domainName]]["fields"][nameOfProperty] = { "type": ranges };
      inputClassList[["Input" + domainName]]["fields"][nameOfProperty] = { "type": inputRanges };
      filterClassList[["Filter" + domainName]]["fields"][nameOfProperty] = { "type": [inputRanges] };
    }

  }

  //inheritance

  for (var baseClass of classesSet) {
    var sup = database.getObjs(baseClass, "http://www.w3.org/2000/01/rdf-schema#subClassOf");
    var inheritedProperties = {};
    for (var superiorClassName of sup) {
      inheritedProperties = classList[removeNamespace(superiorClassName)].fields;
      inheritedProperties = inputClassList["Input" + removeNamespace(superiorClassName)].fields;
      inheritedProperties = filterClassList["Filter" + removeNamespace(superiorClassName)].fields;

      classList[removeNamespace(baseClass)].fields = {
        ...classList[removeNamespace(baseClass)].fields,
        ...inheritedProperties
      };

      inputClassList["Input" + removeNamespace(baseClass)].fields = {
        ...inputClassList["Input" + removeNamespace(baseClass)].fields,
        ...inheritedProperties
      };

      filterClassList["Filter" + removeNamespace(baseClass)].fields = {
        ...filterClassList["Filter" + removeNamespace(baseClass)].fields,
        ...inheritedProperties
      };
    }
  }

  return { classList: classList, inputClassList: inputClassList, filterClassList: filterClassList, classesSet: classesSet, properties: properties };
}

/**
 * Create query type
 * @param {classList}
 * @param {filterClassList}
 * @param {classesSet}
 * @param {properties} 
 */

function createQueryType(classList, filterClassList, classesSet, properties) {
  properties = properties.map(e => removeNamespace(e));
  classesSet = classesSet.filter(e => !scalarTypes.includes(e)).map(e => removeNamespace(e));

  var contextType = {
    name: "_CONTEXT", fields: {
      "_id": { type: graphql.GraphQLString, description: "The unique identifier of the object" },
      "_type": { type: graphql.GraphQLString, description: "Types of the object" }
    }
  };

  for (var prop of properties) {
    contextType.fields[prop] = { type: graphql.GraphQLString };
  }

  for (var className of classesSet) {
    contextType.fields[className] = { type: graphql.GraphQLString };
  }

  contextType = new graphql.GraphQLObjectType(contextType);

  var queryType = {
    name: "Query",
    description: "Get objects of specific types",
    fields: {
      "_CONTEXT": { type: contextType, description: "The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema." }
    }
  };

  const getFields = (object) => {
    return () => {
      let fields = {
        "_id": { type: graphql.GraphQLNonNull(graphql.GraphQLID), description: "The unique identifier of the object" },
        "_type": { type: graphql.GraphQLList(graphql.GraphQLString), description: "Types of the object", args: { "inferred": { type: graphql.GraphQLBoolean, description: "Include inferred types for this object", defaultValue: false } } }
      };

      for (let fieldName in object.fields) {
        let fieldType = object.fields[fieldName]["type"];
        if (fieldType == "Int") {
          fields[fieldName] = {
            type: graphql.GraphQLInt,
            description: fieldName + " of type Int"
          };
        } else if (fieldType == "Float") {
          fields[fieldName] = {
            type: graphql.GraphQLFloat,
            description: fieldName + " of type Float"
          };
        } else if (fieldType == "String") {
          fields[fieldName] = {
            type: graphql.GraphQLString,
            description: fieldName + " of type String"

          };
        } else if (fieldType == "Boolean") {
          fields[fieldName] = {
            type: graphql.GraphQLBoolean,
            description: fieldName + " of type Boolean"
          };
        } else {
          fields[fieldName] = {
            type: gqlObjects[fieldType],
            description: fieldName + " of type " + fieldType
          };
        }
      }
      return fields;
    };
  };

  const filterGetFields = (object) => {
    return () => {
      let fields = {
        "_id": { type: graphql.GraphQLList(graphql.GraphQLID), description: "The unique identifier of the object" },
      };

      for (let fieldName in object.fields) {
        let fieldType = object.fields[fieldName]["type"];
        if (fieldType == "Int") {
          fields[fieldName] = {
            type: graphql.GraphQLList(graphql.GraphQLInt),
            description: fieldName + " of type [Int]"
          };
        } else if (fieldType == "Float") {
          fields[fieldName] = {
            type: graphql.GraphQLList(graphql.GraphQLFloat),
            description: fieldName + " of type [Float]"
          };
        } else if (fieldType == "String") {
          fields[fieldName] = {
            type: graphql.GraphQLList(graphql.GraphQLString),
            description: fieldName + " of type [String]"
          };
        } else if (fieldType == "Boolean") {
          fields[fieldName] = {
            type: graphql.GraphQLList(graphql.GraphQLBoolean),
            description: fieldName + " of type [Boolean]"
          };
        } else {
          fields[fieldName] = {
            type: graphql.GraphQLList(graphql.GraphQLID),
            description: fieldName + " of type [ID]"
          };
        }
      }
      return fields;
    };
  };

  for (var c in classList) {
    gqlObjects[c] = graphql.GraphQLList(new graphql.GraphQLObjectType({
      name: c,
      description: c,
      fields: getFields(classList[c])
    }));
    gqlObjects["Filter" + c] = new graphql.GraphQLInputObjectType({
      name: "Filter" + c,
      description: "Filter on type: " + c,
      fields: filterGetFields(filterClassList["Filter" + c])
    });
    queryType.fields[c] = { type: gqlObjects[c], description: "Get objects of type: " + c, args: { "page": { type: graphql.GraphQLInt }, "inferred": { type: graphql.GraphQLBoolean, defaultValue: false }, "filter": { type: gqlObjects["Filter" + c] } } };
  }

  queryType = new graphql.GraphQLObjectType(queryType);
  return queryType;
}

/**
 * Create query type
 * @param  {} 
 */

function createMutationType(classList, inputClassList) {
  var inputEnum = new graphql.GraphQLEnumType({ name: "MutationType", description: "Put the item into the database. If already exists - overwrite it.", values: { "PUT": { value: 0 } } });
  var mutationType = {
    name: "Mutation",
    description: "CRUD operations over objects of specific types",
    fields: {
      "DELETE": {
        type: graphql.GraphQLBoolean,
        description: "Delete an object",
        args: {
          "id": { type: graphql.GraphQLNonNull(graphql.GraphQLID), description: "An id of the object to be deleted" }
        }
      },
    }
  };

  const getFields = (object) => {
    return () => {
      let fields = {
        "_id": { type: graphql.GraphQLNonNull(graphql.GraphQLID), description: "The unique identifier of the object" },
      };
      for (let fieldName in object.fields) {
        let fieldType = object.fields[fieldName]["type"];
        if (fieldType == "Int") {
          fields[fieldName] = {
            type: graphql.GraphQLInt,
            description: fieldName + " of type Int"
          };
        } else if (fieldType == "Float") {
          fields[fieldName] = {
            type: graphql.GraphQLFloat,
            description: fieldName + " of type Float"
          };
        } else if (fieldType == "String") {
          fields[fieldName] = {
            type: graphql.GraphQLString,
            description: fieldName + " of type String"
          };
        } else if (fieldType == "Boolean") {
          fields[fieldName] = {
            type: graphql.GraphQLBoolean,
            description: fieldName + " of type Boolean"
          };
        } else {
          fields[fieldName] = {
            type: graphql.GraphQLList(graphql.GraphQLID),
            description: fieldName + " of type [ID]"
          };
        }

      }
      return fields;
    };
  };

  for (var c in classList) {
    gqlObjects["Input" + c] = new graphql.GraphQLInputObjectType({
      name: "Input" + c,
      description: "Input object of type: " + c,
      fields: getFields(inputClassList["Input" + c])
    });
    mutationType.fields[c] = { type: graphql.GraphQLBoolean, description: "Perform mutation over an object of type: Input" + c, args: { input: { type: graphql.GraphQLNonNull(gqlObjects["Input" + c]), description: "The input object of the mutation" }, type: { type: inputEnum, defaultValue: 0, description: "The type of the mutation to be applied" } } };
  }

  mutationType = new graphql.GraphQLObjectType(mutationType);
  return mutationType;
}

/**
 * Create query type
 * @param  {} 
 */

async function main() {
  var { classList, inputClassList, filterClassList, classesSet, properties } = await createClassList();
  var queryType = createQueryType(classList, filterClassList, classesSet, properties);
  var mutationType = createMutationType(classList, inputClassList);
  var schema = new graphql.GraphQLSchema({ query: queryType, mutation: mutationType });
  var app = express();
  app.use("/graphql", graphqlHTTP({
    schema: schema,
    graphiql: true,
  }));
  app.listen(4000);
  console.log("Running a GraphQL API server at localhost:4000/graphql");
  return schema;
}

/**
 * Create query type
 * @param  {} 
 */

async function generateSchema(file) {
  var { classList, inputClassList, filterClassList, classesSet, properties } = await createClassList(file);
  var queryType = createQueryType(classList, filterClassList, classesSet, properties);
  var mutationType = createMutationType(classList, inputClassList);
  return new graphql.GraphQLSchema({ query: queryType, mutation: mutationType });
}

module.exports = {
  generateSchema: generateSchema
};

main();