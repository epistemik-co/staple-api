const DatabaseInterface = require("./database/Database");
const database = new DatabaseInterface();
var express = require("express");
var graphqlHTTP = require("express-graphql");
var graphql = require("graphql");

//map of GraphQLObjectTypes and GraphQLInputObjectTypes

var gqlObjects = {};

//list of scalar types uris

var scalarTypes = ["http://www.w3.org/2001/XMLSchema#string",
  "http://www.w3.org/2001/XMLSchema#integer",
  "http://www.w3.org/2001/XMLSchema#boolean",
  "http://www.w3.org/2001/XMLSchema#decimal"];

/**
 * Remove namespace removes namespace prefixes
 * @param  {String} nameWithNamesapace 
 */

function removeNamespace(nameWithNamesapace) {
  nameWithNamesapace = nameWithNamesapace.split(/([/|#])/);
  nameWithNamesapace = nameWithNamesapace[nameWithNamesapace.length - 1];
  return nameWithNamesapace;
}

/**
 * Create classList creates all helper class lists later used to create queryType and mutationType
 * @param  {String} filename name of ontology file
 * @returns {classList} helper object for building output types and queries 
 * @returns {inputClassList} helper object for building input types and mutations
 * @returns {filterClassList} helper object for building filters
 * @returns {classesURIs} list of classes ad uris
 * @returns {propertiesURIs} list of properties as uris
 */

async function createClassList(filename = "test.ttl" /*example file*/) {

  //load file to in-memory graphy.js database 

  await database.readFromFile(filename);
  const classes = database.getInstances("http://www.w3.org/2000/01/rdf-schema#Class");
  const subClasses = database.getAllSubs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
  const superClasses = database.getAllObjs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
  const domainIncludes = database.getAllObjs("http://schema.org/domainIncludes");
  const rangeIncludes = database.getAllObjs("http://schema.org/rangeIncludes");
  const propertiesInstances = database.getInstances("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property");
  const propertiesDomainIncludes = database.getAllSubs("http://schema.org/domainIncludes");
  const propertiesRangeIncludes = database.getAllSubs("http://schema.org/rangeIncludes");
  const functionalProperties = database.getInstances("http://www.w3.org/2002/07/owl#FunctionalProperty");

  //list of all classes as uris

  let classesURIs = [...new Set([...classes, ...subClasses, ...superClasses, ...domainIncludes, ...rangeIncludes, ...rangeIncludes])];
  classesURIs = classesURIs.filter(item => item !== "http://www.w3.org/2000/01/rdf-schema#Class" && item !== "http://schema.org/Enumeration");

  //list of all properties

  let propertiesURIs = [...new Set([...propertiesInstances, ...propertiesDomainIncludes, ...propertiesRangeIncludes, ...functionalProperties])];

  //helper objects initialisation

  var classList = {};
  var inputClassList = {};
  var filterClassList = {};

  //filling the helper objects with hierarchy of classes and properties

  for (var propertyIter in propertiesURIs) {
    var nameOfProperty = removeNamespace(propertiesURIs[propertyIter]);
    var domains = database.getObjs(propertiesURIs[propertyIter], "http://schema.org/domainIncludes");
    var ranges = database.getObjs(propertiesURIs[propertyIter], "http://schema.org/rangeIncludes");
    for (var domainIter in domains) {
      var domainName = removeNamespace(domains[domainIter]);
      if (!(domainName in classList
      )) {
        classList[[domainName]] = { "name": domainName, "fields": {} };
        inputClassList[["Input" + domainName]] = { "name": "Input" + domainName, "fields": {} };
        filterClassList[["Filter" + domainName]] = { "name": "Filter" + domainName, "fields": {} };
      }

      ranges = ranges.map(r => removeNamespace(r));
      var inputRanges = ranges.map(r => "Input" + removeNamespace(r));

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

  for (var subClass of classesURIs) {
    var superClass = database.getObjs(subClass, "http://www.w3.org/2000/01/rdf-schema#subClassOf");
    var inheritedProperties = {};
    var inputInheritedProperties = {};
    var filterInheritedProperties = {};
    for (var superClassName of superClass) {
      inheritedProperties = classList[removeNamespace(superClassName)].fields;
      inputInheritedProperties = inputClassList["Input" + removeNamespace(superClassName)].fields;
      filterInheritedProperties = filterClassList["Filter" + removeNamespace(superClassName)].fields;

      classList[removeNamespace(subClass)].fields = {
        ...classList[removeNamespace(subClass)].fields,
        ...inheritedProperties
      };

      inputClassList["Input" + removeNamespace(subClass)].fields = {
        ...inputClassList["Input" + removeNamespace(subClass)].fields,
        ...inputInheritedProperties
      };

      filterClassList["Filter" + removeNamespace(subClass)].fields = {
        ...filterClassList["Filter" + removeNamespace(subClass)].fields,
        ...filterInheritedProperties
      };
    }
  }

  return { classList: classList, inputClassList: inputClassList, filterClassList: filterClassList, classesURIs: classesURIs, propertiesURIs: propertiesURIs };
}

/**
 * Create query type
 * @param {classList}
 * @param {filterClassList}
 * @param {classesSet}
 * @param {properties} 
 */

function createQueryType(classList, filterClassList, classesURIs, propertiesURIs) {
  propertiesURIs = propertiesURIs.map(e => removeNamespace(e));
  classesURIs = classesURIs.filter(e => !scalarTypes.includes(e)).map(e => removeNamespace(e));

  var contextType = {
    name: "_CONTEXT", fields: {
      "_id": { type: graphql.GraphQLString, description: "The unique identifier of the object" },
      "_type": { type: graphql.GraphQLString, description: "Types of the object" }
    }
  };

  for (var property of propertiesURIs) {
    contextType.fields[property] = { type: graphql.GraphQLString };
  }

  for (var classURI of classesURIs) {
    contextType.fields[classURI] = { type: graphql.GraphQLString };
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

  for (var className in classList) {
    gqlObjects[className] = graphql.GraphQLList(new graphql.GraphQLObjectType({
      name: className,
      description: className,
      fields: getFields(classList[className])
    }));
    gqlObjects["Filter" + className] = new graphql.GraphQLInputObjectType({
      name: "Filter" + className,
      description: "Filter on type: " + className,
      fields: filterGetFields(filterClassList["Filter" + className])
    });
    queryType.fields[className] = { type: gqlObjects[className], description: "Get objects of type: " + className, args: { "page": { type: graphql.GraphQLInt }, "inferred": { type: graphql.GraphQLBoolean, defaultValue: false }, "filter": { type: gqlObjects["Filter" + className] } } };
  }

  queryType = new graphql.GraphQLObjectType(queryType);
  return queryType;
}

/**
 * Create mutation type
 * @param  {classList}
 * @param {inputClassList} 
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
          "id": { type: graphql.GraphQLList(graphql.GraphQLNonNull(graphql.GraphQLID)), description: "An id of the object to be deleted" }
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

  for (var className in classList) {
    gqlObjects["Input" + className] = new graphql.GraphQLInputObjectType({
      name: "Input" + className,
      description: "Input object of type: " + className,
      fields: getFields(inputClassList["Input" + className])
    });
    mutationType.fields[className] = { type: graphql.GraphQLBoolean, description: "Perform mutation over an object of type: Input" + className, args: { input: { type: graphql.GraphQLNonNull(gqlObjects["Input" + className]), description: "The input object of the mutation" }, type: { type: inputEnum, defaultValue: 0, description: "The type of the mutation to be applied" } } };
  }
  mutationType = new graphql.GraphQLObjectType(mutationType);
  return mutationType;
}

/**
 * Main for development
 */

// async function main() {
//   var { classList, inputClassList, filterClassList, classesURIs, propertiesURIs } = await createClassList();
//   var queryType = createQueryType(classList, filterClassList, classesURIs, propertiesURIs);
//   var mutationType = createMutationType(classList, inputClassList);
//   var schema = new graphql.GraphQLSchema({ query: queryType, mutation: mutationType });
//   var app = express();

//   app.use("/graphql", graphqlHTTP({
//     schema: schema,
//     graphiql: true,
//   }));
//   app.listen(4000);
//   console.log("Running a GraphQL API server at localhost:4000/graphql");
//   return schema;
// }

/**
 * Generate schema
 * @param  {file} file containing ontology
 */

async function generateSchema(file) {
  var { classList, inputClassList, filterClassList, classesURIs, propertiesURIs } = await createClassList(file);
  var queryType = createQueryType(classList, filterClassList, classesURIs, propertiesURIs);
  var mutationType = createMutationType(classList, inputClassList);
  return new graphql.GraphQLSchema({ query: queryType, mutation: mutationType });
}

module.exports = {
  generateSchema: generateSchema
};
