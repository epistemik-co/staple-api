const DatabaseInterface = require("./database/Database");
const database = new DatabaseInterface();
var express = require("express");
var graphqlHTTP = require("express-graphql");
var graphql = require("graphql");

// eslint-disable-next-line no-undef
var gqlObjects = {};

async function createClassList(filename="test.ttl"){
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
  // eslint-disable-next-line no-unused-vars
  let classesSet = [...new Set([...classes, ...subClassesAll, ...subClassesObcjects, ...domainIncludes, ...rangeIncludes, ...dataTypes, ...rangeIncludes])];
  classesSet = classesSet.filter(item => item !== "http://www.w3.org/2000/01/rdf-schema#Class" && item !== "http://schema.org/Enumeration");
  let properties = [...new Set([...propertiesInstances, ...propertiesDomainIncludes, ...propertiesRangeIncludes, ...functionalProperties, ...inverseFunctionalProperties])];
  // eslint-disable-next-line no-undef
  var classList = {};

  for (var i in properties){
    var name_of_property = properties[i].replace("http://schema.org/", "");
    var domains = database.getObjs(properties[i], "http://schema.org/domainIncludes");
    var ranges = database.getObjs(properties[i], "http://schema.org/rangeIncludes");
    for (var d in domains){
      var domain_name = String(domains[d].split("/")[3]);
      if (!(domain_name in classList
    )){
    classList[[domain_name]] = {"name": domain_name, "fields": {}};
      }
      ranges = ranges.map(r => r.replace("http://schema.org/", ""));
      for (var r in ranges){
        if (ranges[r] == "http://www.w3.org/2001/XMLSchema#integer"){
          ranges[r] = graphql.GraphQLInt;
        }else if (ranges[r] == "http://www.w3.org/2001/XMLSchema#string"){
          ranges[r] = graphql.GraphQLString;
        }else if (ranges[r] == "http://www.w3.org/2001/XMLSchema#boolean"){
          ranges[r] = graphql.GraphQLBoolean;
        }else if (ranges[r] == "http://www.w3.org/2001/XMLSchema#decimal"){
          ranges[r] = graphql.GraphQLFloat;
        }
      }
      classList[[domain_name]]["fields"][name_of_property] = {"type": ranges};
    }
  }
  return classList;
}

function createQueryType(classList){
    var queryType = {
        name: "Query",
        fields: {
        }
    };

    const getFields = (object) => {
        return () => {
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
                        // eslint-disable-next-line no-undef
                        type: gqlObjects[fieldType]
                    };
                }
            }
            return fields;
        };
    };
    for (var c in classList) {
        // eslint-disable-next-line no-undef
        gqlObjects[c] = new graphql.GraphQLObjectType({
            name: c,
            fields: getFields(classList[c]) 
            });
        // eslint-disable-next-line no-undef
        queryType.fields["get" + c] = {type: gqlObjects[c]};

    }
    queryType = new graphql.GraphQLObjectType(queryType);
    return queryType;
}

async function main () {
var classList = await createClassList();
var queryType = createQueryType(classList);
var schema = new graphql.GraphQLSchema({query: queryType});
var app = express();
app.use("/graphql", graphqlHTTP({
  schema: schema,
  graphiql: true,
}));
app.listen(4000);
console.log("Running a GraphQL API server at localhost:4000/graphql");
return schema;
}
main();