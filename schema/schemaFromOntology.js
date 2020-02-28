const DatabaseInterface = require("./database/database");
let database = new DatabaseInterface(); 
const logger = require("../config/winston");
var graphql = require("graphql");

//map of GraphQLObjectTypes and GraphQLInputObjectTypes

var gqlObjects = {};

var graphQLScalarTypes = {
  "Boolean" : graphql.GraphQLBoolean,
  "String" : graphql.GraphQLString,
  "Float" : graphql.GraphQLFloat,
  "Int" : graphql.GraphQLInt,
  "boolean" : graphql.GraphQLBoolean,
  "string" : graphql.GraphQLString,
  "decimal" : graphql.GraphQLFloat,
  "integer" : graphql.GraphQLInt
};

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
  if (ontology.string){
    await database.readFromString(ontology.string);
    logger.info("Schema generated from string");
  }else if (ontology.file){
    await database.readFromFile(ontology.file);
    logger.info("Schema generated from file");
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
        if (graphQLScalarTypes[ranges[r]]){
          ranges[r] = graphQLScalarTypes[ranges[r]];
          inputRanges[r] = graphQLScalarTypes[ranges[r]];
        }
      }
      var classComment = database.getObjs(domains[domainIter], "http://www.w3.org/2000/01/rdf-schema#comment");
      classList[[domainName]]["fields"][nameOfProperty] = { "type": ranges, "description": comments};
      classList[[domainName]]["description"] = classComment;
      inputClassList[["Input" + domainName]]["fields"][nameOfProperty] = { "type": inputRanges,"description": comments };
      filterClassList[["Filter" + domainName]]["fields"][nameOfProperty] = { "type": [inputRanges], "description": comments };
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

function getFieldsQuery(object){
  return () => {
    let fields = {
      "_id": { type: graphql.GraphQLNonNull(graphql.GraphQLID), description: "The unique identifier of the object" },
      "_type": { type: graphql.GraphQLList(graphql.GraphQLString), description: "Types of the object", args: { "inferred": { type: graphql.GraphQLBoolean, description: "Include inferred types for this object", defaultValue: false } } }
    };

    for (let fieldName in object.fields) {
      let fieldType = object.fields[fieldName]["type"];
      if (graphQLScalarTypes[fieldType]){
        fields[fieldName] = {
          type: graphQLScalarTypes[fieldType],
          description: String(object.fields[fieldName]["description"])
        };
      } else {
        fields[fieldName] = {
          type: gqlObjects[fieldType],
          description: String(object.fields[fieldName]["description"])
        };
      }
    }
    return fields;
  };
}

function filterGetFields(object){
  return () => {
    let fields = {
      "_id": { type: graphql.GraphQLList(graphql.GraphQLID), description: "The unique identifier of the object" },
    };

    for (let fieldName in object.fields) {
      let fieldType = object.fields[fieldName]["type"];
      if (graphQLScalarTypes[fieldType]){
        fields[fieldName] = {
          type: graphql.GraphQLList(graphQLScalarTypes[fieldType]),
          description: String(object.fields[fieldName]["description"])
        };
      } else {
        fields[fieldName] = {
          type: graphql.GraphQLList(graphql.GraphQLID),
          description: String(object.fields[fieldName]["description"])
        };
      }
    }
    return fields;
  };
}

function createQueryType(classList, filterClassList, classesURIs, propertiesURIs) {

//context query

  var contextType = {
    name: "_CONTEXT", fields: {
      "_id": { type: graphql.GraphQLString, description: "@id" },
      "_type": { type: graphql.GraphQLString, description: "@type" },
      "_SOURCE": {type: graphql.GraphQLString, description: "source description"} //to do
    },
    description : "The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema."
  };

  for (var property of propertiesURIs) {
    contextType.fields[removeNamespace(property)] = { type: graphql.GraphQLString, description: property };
  }

  for (var classURI of classesURIs) {
    contextType.fields[removeNamespace(classURI)] = { type: graphql.GraphQLString, description: classURI };
  }

  contextType = new graphql.GraphQLObjectType(contextType);

//the rest of the queries

  var queryType = {
    name: "Query",
    description: "Get objects of specific types",
    fields: {
      "_CONTEXT": { type: contextType, description: "The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema." }
    }
  };

  for (var className in classList) {
    gqlObjects[className] = graphql.GraphQLList(new graphql.GraphQLObjectType({
      name: className,
      description: String(classList[className].description),
      fields: getFieldsQuery(classList[className])
    }));
    gqlObjects["Filter" + className] = new graphql.GraphQLInputObjectType({
      name: "Filter" + className,
      description: String(classList[className].description),
      fields: filterGetFields(filterClassList["Filter" + className])
    });
    queryType.fields[className] = { type: gqlObjects[className], description: "Get objects of type: " + className, args: { "page": { type: graphql.GraphQLInt }, "inferred": { type: graphql.GraphQLBoolean, defaultValue: false }, "filter": { type: gqlObjects["Filter" + className] }, "source": {type: graphql.GraphQLString} } };
  }
  queryType = new graphql.GraphQLObjectType(queryType);
  return queryType;
}

function getFieldsMutation(object){
  return () => {
    let fields = {
      "_id": { type: graphql.GraphQLNonNull(graphql.GraphQLID), description: "The unique identifier of the object" },
    };
    for (let fieldName in object.fields) {
      let fieldType = object.fields[fieldName]["type"];
      if (graphQLScalarTypes[fieldType]){
        fields[fieldName] = {
          type: graphQLScalarTypes[fieldType],
          description: String(object.fields[fieldName]["description"])
        };
      } else {
        fields[fieldName] = {
          type: graphql.GraphQLList(graphql.GraphQLID),
          description: String(object.fields[fieldName]["description"])
        };
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
          "source": {type: graphql.GraphQLString, description: "source description"}
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
    mutationType.fields[className] = { type: graphql.GraphQLBoolean, description: "Perform mutation over an object of type: Input" + className, args: { input: { type: graphql.GraphQLNonNull(gqlObjects["Input" + className]), description: "The input object of the mutation" }, type: { type: inputEnum, defaultValue: 0, description: "The type of the mutation to be applied" }, "source": {type: graphql.GraphQLString, description: "source description"} } };
  }
  mutationType = new graphql.GraphQLObjectType(mutationType);
  return mutationType;
}

/**
 * Generate schema
 * @param  {file} file containing ontology
 */

async function generateSchema(ontology) {
  database = new DatabaseInterface();
  var { classList, inputClassList, filterClassList, classesURIs, propertiesURIs } = await createClassList(ontology);
  var queryType = createQueryType(classList, filterClassList, classesURIs, propertiesURIs);
  var mutationType = createMutationType(classList, inputClassList);
  return new graphql.GraphQLSchema({ query: queryType, mutation: mutationType });
}

module.exports = {
  generateSchema: generateSchema
};

// generateSchema({string: `@prefix schema: <http://schema.org/> .
// @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
// @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
// @prefix owl: <http://www.w3.org/2002/07/owl#> .
// @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
// @prefix example: <http://example.com/> .
// # classes (-> GraphQL types )
// example:Agent a rdfs:Class ;
//     rdfs:comment "An agent (individual or legal)" .
// example:Organization a rdfs:Class ;
//     rdfs:comment "An organization such as a school, NGO, corporation, club, etc." ;
//     rdfs:subClassOf example:Agent .
// example:Person a rdfs:Class ;
//     rdfs:comment "A person" ;
//     rdfs:subClassOf example:Agent .
// # properties ( -> GraphQL fields )
// example:name a rdf:Property, owl:FunctionalProperty ;
//     rdfs:comment "Name of the agent" ;
//     schema:domainIncludes example:Agent ;
//     schema:rangeIncludes xsd:string .
// example:age a rdf:Property, owl:FunctionalProperty ;
//     rdfs:comment "Age of the person" ;
//     schema:domainIncludes example:Person ;
//     schema:rangeIncludes xsd:integer .
// example:isMarried a rdf:Property, owl:FunctionalProperty ;
//     rdfs:comment "This person is married" ;
//     schema:domainIncludes example:Person ;
//     schema:rangeIncludes xsd:boolean .
// example:revenue a rdf:Property, owl:FunctionalProperty ;
//     rdfs:comment "The annual revenue of the organization" ;
//     schema:domainIncludes example:Organization ;
//     schema:rangeIncludes xsd:decimal .
// example:employee a rdf:Property ;
//     rdfs:comment "An employee of an organization" ;
//     schema:domainIncludes example:Organization ;
//     schema:rangeIncludes example:Person .
// example:customerOf a rdf:Property ;
//     rdfs:comment "An organization this agent is a customer of" ;
//     schema:domainIncludes example:Agent ;
//     schema:rangeIncludes example:Organization .`})

