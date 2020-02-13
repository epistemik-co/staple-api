/* eslint-disable no-unused-vars */
const DatabaseInterface = require("./database/Database");
const database = new DatabaseInterface();
var express = require("express");
var graphqlHTTP = require("express-graphql");
var graphql = require("graphql");

var gqlObjects = {};

async function createClassList(filename = "test.ttl") {
  await database.readFromFile(filename);
  const classes = database.getInstances("http://www.w3.org/2000/01/rdf-schema#Class");
  const subClassesAll = database.getAllSubs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
  const subClassesObcjects = database.getAllObjs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
  const domainIncludes = database.getAllObjs("http://schema.org/domainIncludes");
  const rangeIncludes = database.getAllObjs("http://schema.org/rangeIncludes");
  const dataTypes = database.getInstances("http://schema.org/DataType");
  const propertiesInstances = database.getInstances("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property");
  const propertiesDomainIncludes = database.getAllSubs("http://schema.org/domainIncludes");
  const propertiesRangeIncludes = database.getAllSubs("http://schema.org/rangeIncludes");
  const functionalProperties = database.getInstances("http://www.w3.org/2002/07/owl#FunctionalProperty");
  const inverseFunctionalProperties = database.getInstances("http://www.w3.org/2002/07/owl#InverseFunctionalProperty");
  let classesSet = [...new Set([...classes, ...subClassesAll, ...subClassesObcjects, ...domainIncludes, ...rangeIncludes, ...dataTypes, ...rangeIncludes])];
  classesSet = classesSet.filter(item => item !== "http://www.w3.org/2000/01/rdf-schema#Class" && item !== "http://schema.org/Enumeration");
  let properties = [...new Set([...propertiesInstances, ...propertiesDomainIncludes, ...propertiesRangeIncludes, ...functionalProperties, ...inverseFunctionalProperties])];
  var classList = {};
  var inputClassList = {};

  for (var i in properties) {
    var name_of_property = properties[i].replace("http://schema.org/", "");
    var domains = database.getObjs(properties[i], "http://schema.org/domainIncludes");
    var ranges = database.getObjs(properties[i], "http://schema.org/rangeIncludes");
    for (var d in domains) {
      var domain_name = String(domains[d].split("/")[3]);
      if (!(domain_name in classList
      )) {
        classList[[domain_name]] = { "name": domain_name, "fields": {} };
        inputClassList[["Input" + domain_name]] = { "name": "Input" + domain_name, "fields": {} };
      }

      // TO NIE KONIECZNIE DZIAŁA :/
      try {
        ranges = ranges.map(r => r.replace("http://schema.org/", ""));
        var inputRanges = ranges.map(r => r.replace("http://schema.org/", "Input"));
      } catch (error) {
        console.log(ranges);
      }

      for (var r in ranges) {
        if (ranges[r] == "http://www.w3.org/2001/XMLSchema#integer") {
          ranges[r] = graphql.GraphQLInt;
          inputRanges[r] = graphql.GraphQLInt;
        } else if (ranges[r] == "http://www.w3.org/2001/XMLSchema#string") {
          ranges[r] = graphql.GraphQLString;
          inputRanges[r] = graphql.GraphQLString;
        } else if (ranges[r] == "http://www.w3.org/2001/XMLSchema#boolean") {
          ranges[r] = graphql.GraphQLBoolean;
          inputRanges[r] = graphql.GraphQLBoolean;
        } else if (ranges[r] == "http://www.w3.org/2001/XMLSchema#decimal") {
          ranges[r] = graphql.GraphQLFloat;
          inputRanges[r] = graphql.GraphQLFloat;
        }
      }
      classList[[domain_name]]["fields"][name_of_property] = { "type": ranges };
      inputClassList[["Input" + domain_name]]["fields"][name_of_property] = { "type": inputRanges };
    }
  }
  console.log(inputClassList)
  return {classList: classList, inputClassList: inputClassList};
}

function createQueryType(classList) {
  var queryType = {
    name: "Query",
    fields: {
    }
  };

  const getFields = (object) => {
    return () => {
      let fields = {
        "_id": { type: graphql.GraphQLNonNull(graphql.GraphQLID) },
        "_type": { type: graphql.GraphQLList(graphql.GraphQLString) }
      };

      for (let fieldName in object.fields) {
        let fieldType = object.fields[fieldName]["type"];
        if (fieldType == "Int") {
          fields[fieldName] = {
            type: graphql.GraphQLInt
          };
        } else if (fieldType == "Float") {
          fields[fieldName] = {
            type: graphql.GraphQLFloat
          };
        } else if (fieldType == "String") {
          fields[fieldName] = {
            type: graphql.GraphQLString
          };
        } else if (fieldType == "Boolean") {
          fields[fieldName] = {
            type: graphql.GraphQLBoolean
          };
        } else {
          fields[fieldName] = {
            type: gqlObjects[fieldType]
          };
        }
      }
      return fields;
    };
  };
  for (var c in classList) {
    gqlObjects[c] = graphql.GraphQLList( new graphql.GraphQLObjectType({
      name: c,
      fields: getFields(classList[c])
    }));
    queryType.fields[c] = { type: gqlObjects[c] };

  }
  queryType = new graphql.GraphQLObjectType(queryType);
  return queryType;
}

function createMutationType(classList, inputClassList){
  var mutationType = {
    name: "Mutation",
    fields: {
    }
  };

  const getFields = (object) => {
    return () => {
      let fields = {
        "_id": { type: graphql.GraphQLNonNull(graphql.GraphQLID) },
      };
        console.log(object);
        for (let fieldName in object.fields) {
            let fieldType = object.fields[fieldName]["type"];
            if (fieldType == "Int"){
                fields[fieldName] = {
                    type: graphql.GraphQLInt
                };
            }else if (fieldType == "Float"){
                fields[fieldName] = {
                    type: graphql.GraphQLFloat
                };
            }else if (fieldType == "String"){
                fields[fieldName] = {
                    type: graphql.GraphQLString
                };
            }else if (fieldType == "Boolean"){
                fields[fieldName] = {
                    type: graphql.GraphQLBoolean
                };
            }else {
                fields[fieldName] = {
                    type: gqlObjects["Input" + fieldType]
                };
            }

        }
        return fields;
    };
  };

  const getArgs = (object) => {
        let fields = {};
        for (let fieldName in object.fields) {
            let fieldType = object.fields[fieldName]["type"];
            if (fieldType == "Int"){
                fields[fieldName] = {
                    type: graphql.GraphQLInt
                };
            }else if (fieldType == "Float"){
                fields[fieldName] = {
                    type: graphql.GraphQLFloat
                };
            }else if (fieldType == "String"){
                fields[fieldName] = {
                    type: graphql.GraphQLString
                };
            }else if (fieldType == "Boolean"){
                fields[fieldName] = {
                    type: graphql.GraphQLBoolean
                };
            }else {
                fields[fieldName] = {
                    type: gqlObjects[fieldType]
                };
            }

        }
        return fields;
  };

  for (var c in classList) {
      // console.log(classList[c])
      gqlObjects["Input" + c] = new graphql.GraphQLInputObjectType({
          name: "Input" + c,
          fields: getFields(inputClassList["Input" + c]) 
          });
      mutationType.fields[c] = {type: gqlObjects[c], args: { input: {type: gqlObjects["Input" + c]}}};
  }
  // console.log(JSON.stringify(mutationType));
  mutationType = new graphql.GraphQLObjectType(mutationType);
  return mutationType;
}

async function main() {
  var {classList, inputClassList} = await createClassList();
  var queryType = createQueryType(classList);
  var mutationType = createMutationType(classList, inputClassList);
  var schema = new graphql.GraphQLSchema({ query: queryType, mutation: mutationType});
  console.log(graphql.printSchema(schema));
  var app = express();
  app.use("/graphql", graphqlHTTP({
    schema: schema,
    graphiql: true,
  }));
  app.listen(4000);
  console.log("Running a GraphQL API server at localhost:4000/graphql");
  return schema;
}

async function generateSchema(file) {
  var {classList, inputClassList} = await createClassList(file);
  var queryType = createQueryType(classList);
  var mutationType = createMutationType(classList, inputClassList);
  return new graphql.GraphQLSchema({ query: queryType, mutation: mutationType });
}

module.exports = {
  generateSchema: generateSchema
};

main();