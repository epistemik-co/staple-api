const DatabaseInterface = require("./database/database");
let database = new DatabaseInterface();
const logger = require("../config/winston");
var graphql = require("graphql");
var request = require("request");

//map of GraphQLObjectTypes and GraphQLInputObjectTypes

var gqlObjects = {};

var graphQLScalarTypes = {
  "Boolean": graphql.GraphQLBoolean,
  "String": graphql.GraphQLString,
  "Float": graphql.GraphQLFloat,
  "Int": graphql.GraphQLInt,
  "boolean": graphql.GraphQLBoolean,
  "string": graphql.GraphQLString,
  "decimal": graphql.GraphQLFloat,
  "integer": graphql.GraphQLInt
};

let dataSourceEnum = {};
let defaultDataSource = "";

/**
 * Remove namespace removes namespace prefixes
 * @param  {String} nameWithNamesapace 
 */

function removeNamespace(nameWithNamesapace) {
  nameWithNamesapace = String(nameWithNamesapace).split(/([/|#])/);
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

async function createClassList(ontology /*example file*/) {
  //load ontology to in-memory graphy.js database 
  if (ontology.file) {
    await database.readFromFile(ontology.file);
    logger.info("Schema generated from file");
  } else if (ontology.url) {
    //read from
    const doRequest = new Promise((resolve, reject) => request.get({ url: ontology.url }, function (error, response) {
      if (error) {
        reject(error);
      }
      resolve(response);
    }));
    const response = await doRequest;
    await database.readFromString(response.body);
    logger.info("Schema generated from url");
  } else {
    try{
      await database.readFromString(ontology);
      logger.info("Schema generated from string");
    } catch (error){
      throw Error("Wrong ontology format");
    }
  }
  const classes = database.getInstances("http://www.w3.org/2000/01/rdf-schema#Class");
  const subClasses = database.getAllSubs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
  const superClasses = database.getAllObjs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
  const domainIncludes = database.getAllObjs("http://schema.org/domainIncludes");
  const rangeIncludes = database.getAllObjs("http://schema.org/rangeIncludes");
  const propertiesInstances = database.getInstances("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property");
  const propertiesDomainIncludes = database.getAllSubs("http://schema.org/domainIncludes");
  const propertiesRangeIncludes = database.getAllSubs("http://schema.org/rangeIncludes");
  const functionalProperties = database.getInstances("http://www.w3.org/2002/07/owl#FunctionalProperty");

  const singleProperties = functionalProperties.map(f => removeNamespace(f));

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
    var comments = database.getObjs(propertiesURIs[propertyIter], "http://www.w3.org/2000/01/rdf-schema#comment");
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
        if (graphQLScalarTypes[ranges[r]]) {
          ranges[r] = graphQLScalarTypes[ranges[r]];
          inputRanges[r] = graphQLScalarTypes[ranges[r]];
        }
      }
      var classComment = database.getObjs(domains[domainIter], "http://www.w3.org/2000/01/rdf-schema#comment");
      classList[[domainName]]["fields"][nameOfProperty] = { "type": ranges, "description": comments, "isList": !singleProperties.includes(nameOfProperty) };
      classList[[domainName]]["description"] = classComment;
      inputClassList[["Input" + domainName]]["fields"][nameOfProperty] = { "type": inputRanges, "description": comments, "isList": !singleProperties.includes(nameOfProperty) };
      filterClassList[["Filter" + domainName]]["fields"][nameOfProperty] = { "type": inputRanges, "description": comments, "isList": !singleProperties.includes(nameOfProperty) };
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

      if (classList[removeNamespace(subClass)]) {
        classList[removeNamespace(subClass)].fields = {
          ...classList[removeNamespace(subClass)].fields,
          ...inheritedProperties
        };
      } else {
        classList[removeNamespace(subClass)] = {};
        classList[removeNamespace(subClass)]["fields"] = {
          ...inheritedProperties
        };
      }


      if (inputClassList["Input" + removeNamespace(subClass)]) {
        inputClassList["Input" + removeNamespace(subClass)].fields = {
          ...inputClassList["Input" + removeNamespace(subClass)].fields,
          ...inputInheritedProperties
        };
      } else {
        inputClassList["Input" + removeNamespace(subClass)] = {};
        inputClassList["Input" + removeNamespace(subClass)].fields = {
          ...inputClassList["Input" + removeNamespace(subClass)].fields,
          ...inputInheritedProperties
        };
      }
      if (filterClassList["Filter" + removeNamespace(subClass)]) {
        filterClassList["Filter" + removeNamespace(subClass)].fields = {
          ...filterClassList["Filter" + removeNamespace(subClass)].fields,
          ...filterInheritedProperties
        };
      } else {
        filterClassList["Filter" + removeNamespace(subClass)] = {};
        filterClassList["Filter" + removeNamespace(subClass)].fields = {
          ...filterClassList["Filter" + removeNamespace(subClass)].fields,
          ...filterInheritedProperties
        };
      }
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

function getFieldsQuery(object) {
  return () => {
    let fields = {
      "_id": { type: graphql.GraphQLNonNull(graphql.GraphQLID), description: "The unique identifier of the object" },
      "_type": { type: graphql.GraphQLList(graphql.GraphQLString), description: "Types of the object", args: { "inferred": { type: graphql.GraphQLBoolean, description: "Include inferred types for this object", defaultValue: false } } }
    };

    for (let fieldName in object.fields) {
      fields[fieldName] = {
        description: String(object.fields[fieldName]["description"])
      };
      let fieldType = object.fields[fieldName]["type"];
      if (graphQLScalarTypes[fieldType]) {
        if (object.fields[fieldName].isList) {
          fields[fieldName].type = graphql.GraphQLList(graphQLScalarTypes[fieldType])
        } else {
          fields[fieldName].type = graphQLScalarTypes[fieldType]
        }
      } else {
        fields[fieldName].args = { "source": { type: graphql.GraphQLList(dataSourceEnum) } }
        if (object.fields[fieldName].isList) {
          fields[fieldName].type = graphql.GraphQLList(gqlObjects[fieldType])
        } else {
          fields[fieldName].type = gqlObjects[fieldType]
        }
      }
    }
    return fields;
  };
}


function filterGetFields(object) {
  return () => {
    let fields = {
      "_id": { type: graphql.GraphQLList(graphql.GraphQLID), description: "The unique identifier of the object" },
    };

    for (let fieldName in object.fields) {
      fields[fieldName] = {
        description: String(object.fields[fieldName]["description"])
      };
      let fieldType = object.fields[fieldName]["type"];
      if (graphQLScalarTypes[fieldType]) {
        if (object.fields[fieldName].isList) {
          fields[fieldName].type = graphql.GraphQLList(graphQLScalarTypes[fieldType])
        } else {
          fields[fieldName].type = graphQLScalarTypes[fieldType]
        }
      } else {
        if (object.fields[fieldName].isList) { 
          fields[fieldName].type = graphql.GraphQLList(graphql.GraphQLID)
        } else {
          fields[fieldName].type = graphql.GraphQLID
        }
      }
    }
    return fields;
  };
}


function createQueryType(classList, filterClassList, classesURIs, propertiesURIs, dataSources, dataSourcesDescriptions) {

  //context query

  var contextType = {
    name: "_CONTEXT", fields: {
      "_id": { type: graphql.GraphQLString, description: "@id" },
      "_type": { type: graphql.GraphQLString, description: "@type" },
    },
    description: "The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema."
  };

  for (var property of propertiesURIs) {
    if (!(removeNamespace(property) in graphQLScalarTypes)) {
      contextType.fields[removeNamespace(property)] = { type: graphql.GraphQLString, description: property };
    }
  }

  for (var classURI of classesURIs) {
    if (!(removeNamespace(classURI) in graphQLScalarTypes)) {
      contextType.fields[removeNamespace(classURI)] = { type: graphql.GraphQLString, description: classURI };
    }
  }

  contextType = new graphql.GraphQLObjectType(contextType);

  // datasources enum

  dataSourceEnum = {
    name: "DataSource",
    description: "Available data sources",
    values: {}
  };

  for (let iter in dataSources) {
    dataSourceEnum["values"][dataSources[iter]] = { value: dataSources[iter], description: dataSourcesDescriptions[dataSources[iter]] };
  }
  dataSourceEnum = new graphql.GraphQLEnumType(dataSourceEnum);
  //the rest of the queries

  var queryType = {
    name: "Query",
    description: "Get objects of specific types",
    fields: {
      "_CONTEXT": { type: contextType, description: "Get elements of the _CONTEXT object" }
     
    }
  };

  //default data source
  let defaultSourceValue;
  if (Array.isArray(defaultDataSource)){
    defaultSourceValue = defaultDataSource.map(d => dataSourceEnum.getValue(d).value);
  } else{
    defaultSourceValue = defaultDataSource;
  }

  for (var className in classList) {
    gqlObjects[className] = new graphql.GraphQLObjectType({
      name: className,
      description: String(classList[className].description),
      fields: getFieldsQuery(classList[className])
    });
    gqlObjects["Filter" + className] = new graphql.GraphQLInputObjectType({
      name: "Filter" + className,
      description: String(classList[className].description),
      fields: filterGetFields(filterClassList["Filter" + className])
    });

    queryType.fields[className] = { type: graphql.GraphQLList(gqlObjects[className]), description: "Get objects of type: " + className, args: { "page": { type: graphql.GraphQLInt, description: "The number of results page to be returned by the query. A page consists of 10 results. If no page argument is provided all matching results are returned." }, "inferred": { type: graphql.GraphQLBoolean, defaultValue: false, description: "Include indirect instances of this type" }, "filter": { type: gqlObjects["Filter" + className], description: "Filters the selected results based on specified field values"}, "source": { type: graphql.GraphQLList(dataSourceEnum), description: "Selected data sources", defaultValue: defaultSourceValue} , "limit": { type: graphql.GraphQLInt, description: "Get limited elements of the object" }
     
    } }; 
    
  }
  queryType = new graphql.GraphQLObjectType(queryType);
  return queryType;
}

function getFieldsMutation(object) {
  return () => {
    let fields = {
      "_id": { type: graphql.GraphQLNonNull(graphql.GraphQLID), description: "The unique identifier of the object" },
    };
    for (let fieldName in object.fields) {
      fields[fieldName] = {
        description: String(object.fields[fieldName]["description"])
      };
      let fieldType = object.fields[fieldName]["type"];
      if (graphQLScalarTypes[fieldType]) {
        if (object.fields[fieldName].isList) {
          fields[fieldName].type = graphql.GraphQLList(graphQLScalarTypes[fieldType])
        } else {
          fields[fieldName].type = graphQLScalarTypes[fieldType]
        }
      } else {
        if (object.fields[fieldName].isList) {
          fields[fieldName].type = graphql.GraphQLList(graphql.GraphQLID)
        } else {
          fields[fieldName].type = graphql.GraphQLID
        }
      }
    }
    return fields;
  };
}

/**
 * Create mutation type
 * @param  {classList} classList is a helper object for accesssing output types
 * @param {inputClassList} inputClassList is a helper object for accessing input types
 */

function createMutationType(classList, inputClassList) {
  let defaultSourceValue;
  if (Array.isArray(defaultDataSource)){
    defaultSourceValue = (defaultDataSource.map(d => dataSourceEnum.getValue(d).value));
  } else{
    defaultSourceValue = defaultDataSource;
  }

  var inputEnum = new graphql.GraphQLEnumType({ name: "MutationType", description: "Put the item into the database. If already exists - overwrite it.", values: { "PUT": { value: 0 } } });
  var mutationType = {
    name: "Mutation",
    description: "CRUD operations over objects of specific types",
    fields: {
      "DELETE": {
        type: graphql.GraphQLBoolean,
        description: "Delete an object",
        args: {
          "id": { type: graphql.GraphQLList(graphql.GraphQLNonNull(graphql.GraphQLID)), description: "An id of the object to be deleted" },
          "source": { type: graphql.GraphQLList(dataSourceEnum), description: "Available data sources", defaultValue: defaultSourceValue }
        }
      },
    }
  };

  for (var className in classList) {
    gqlObjects["Input" + className] = new graphql.GraphQLInputObjectType({
      name: "Input" + className,
      description: String(classList[className].description),
      fields: getFieldsMutation(inputClassList["Input" + className])
    });
    mutationType.fields[className] = { type: graphql.GraphQLBoolean, description: "Perform mutation over an object of type: Input" + className, args: { input: { type: graphql.GraphQLNonNull(gqlObjects["Input" + className]), description: "The input object of the mutation" }, type: { type: inputEnum, defaultValue: 0, description: "The type of the mutation to be applied" }, "source": { type: graphql.GraphQLList(dataSourceEnum), description: "Selected data sources", defaultValue: defaultSourceValue } } };
  }
  mutationType = new graphql.GraphQLObjectType(mutationType);
  return mutationType;
}

function listOfDataSourcesFromConfigObject(configObject) {
  let dataSources = Object.keys(configObject.dataSources).filter(function (x) { return x != "default"; });

  if (Array.isArray(configObject.dataSources.default)){
    for (let i in configObject.dataSources.default){
      if (!(configObject.dataSources.default) || !(dataSources.indexOf(configObject.dataSources.default[i]) >= 0)) {
        throw Error("invalid default datasource!");
      }
    }
  }else{
    if (!(configObject.dataSources.default) || !(dataSources.indexOf(configObject.dataSources.default) >= 0)) {
      throw Error("invalid default datasource!");
    }
  }



  let memoryCounter = 0;
  for (let d in configObject.dataSources) {
    if (configObject.dataSources[d].type == "memory") {
      memoryCounter += 1;
    }
    if (memoryCounter > 1) {
      throw Error("Cannot use more than one data source of type memory!");
    }
  }

  defaultDataSource = (configObject.dataSources.default);

  let dataSourcesDescriptions = {};
  for (let d of dataSources){
    dataSourcesDescriptions[d] = configObject.dataSources[d].description;
  }
  return {dataSources: dataSources, dataSourcesDescriptions: dataSourcesDescriptions};
}

/**
 * Generate schema
 * @param  {file} file containing ontology
 */
async function generateSchema(ontology, configObject) {
  database = new DatabaseInterface();
  var { classList, inputClassList, filterClassList, classesURIs, propertiesURIs } = await createClassList(ontology);
  const values = listOfDataSourcesFromConfigObject(configObject);
  const listOfDataSources = values.dataSources;
  const dataSourcesDescriptions = values.dataSourcesDescriptions;
  var queryType = createQueryType(classList, filterClassList, classesURIs, propertiesURIs, listOfDataSources, dataSourcesDescriptions);
  var mutationType = createMutationType(classList, inputClassList, listOfDataSources, dataSourcesDescriptions);
  return new graphql.GraphQLSchema({ query: queryType, mutation: mutationType });
}

module.exports = {
  generateSchema: generateSchema
};
