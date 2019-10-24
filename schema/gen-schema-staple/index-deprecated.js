const DatabaseInterface = require('./database/Database');
const database = new DatabaseInterface();
const {
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLField,
    GraphQLEnumType,
    GraphQLUnionType,
    GraphQLNonNull,
    GraphQLInt,
    GraphQLString,
    GraphQLID,
    GraphQLList,
    buildSchema,
    printSchema
} = require("graphql");
var express = require('express');
var graphqlHTTP = require('express-graphql');
var fs = require('fs');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getIndirectSublasses(schema_spec) {
    getIndirectSublassesOfClass(schema_spec, "http://schema.org/Thing")
    return schema_spec
}

function getIndirectSublassesOfClass(schema_spec, ofClass) {
    var allSubs = [ofClass]
    schema_spec["classes"][ofClass]["sub"].forEach(function (sub) {
        if (sub != ofClass) {
            if (!allSubs.includes(sub)) {
                allSubs.push(sub)
            }
            var moresubs = getIndirectSublassesOfClass(schema_spec, sub)
            moresubs.forEach(function (subsub) {
                if (!allSubs.includes(subsub)) {
                    allSubs.push(subsub)
                }
            })
        }
    })
    schema_spec["classes"][ofClass]["sub"] = allSubs
    return allSubs
}

async function getAllSubclasses(classes, datatypes, schema_spec) {
    await classes.forEach(function (rdfsclass) {

        var n = rdfsclass.lastIndexOf('/');
        var name = rdfsclass.substring(n + 1);
        const description = database.getSingleStringValue(rdfsclass, "http://www.w3.org/2000/01/rdf-schema#comment");

        schema_spec["classes"][rdfsclass] = {}
        schema_spec["classes"][rdfsclass]["name"] = name
        schema_spec["classes"][rdfsclass]["description"] = description

        if (!datatypes.includes(rdfsclass)) {

            schema_spec["classes"][rdfsclass]["type"] = "Object"
            schema_spec["classes"][rdfsclass]["sub"] = database.getSubClasses(rdfsclass)
            schema_spec["classes"][rdfsclass]["props"] = []

        } else {
            schema_spec["classes"][rdfsclass]["type"] = "Data"
            if (name == "Boolean" || name == "String" || name == "Float" || name == "Int") {
                schema_spec["classes"][rdfsclass]["name"] = name + "_"
            }
        }
    })

    return schema_spec
}

async function processProperties(properties, functionalProperties, schema_spec) {
    await properties.forEach(function (property) {
        const range = database.getObjs(property, "http://schema.org/rangeIncludes")
        const domain = database.getObjs(property, "http://schema.org/domainIncludes")
        const description = database.getSingleStringValue(property, "http://www.w3.org/2000/01/rdf-schema#comment");
        var n = property.lastIndexOf('/');
        var name = property.substring(n + 1);

        schema_spec["properties"][property] = {}
        schema_spec["properties"][property]["range"] = []
        schema_spec["properties"][property]["name"] = name
        let functional = false
        if (functionalProperties.includes(property)) {
            functional = true
        }
        schema_spec["properties"][property]["functional"] = functional
        schema_spec["properties"][property]["description"] = description

        range.forEach(function (rangeClass) {
            if (schema_spec["classes"][rangeClass] != undefined) {
                schema_spec["properties"][property]["range"].push(rangeClass)
            }
        })

        domain.forEach(function (domainClass) {
            if (schema_spec["classes"][domainClass] != undefined) {
                var inherited = schema_spec["classes"][domainClass]["sub"]
                inherited.forEach(function (inheritClass) {
                    if (!schema_spec["classes"][inheritClass]["props"].includes(property)) {
                        schema_spec["classes"][inheritClass]["props"].push(property)
                    }
                })
            }
        })
    })
    return schema_spec
}

function getTypeByName(name, typeDefs) {
    console.log("returning " + typeDefs[name] + " for " + name)
    return typeDefs[name]
}

function getSetOfTypesByNames(names, typeDefs) {
    types = []
    for (var name in names) {
        console.log("name")
        console.log(name)
        types.push(getTypeByName(name, typeDefs))
    }
    return types
}


function getObjectFields(rdfsclass, typecandidates, fieldcandidates, typeDefs) {
    var fields = {
        _id: {
            type: new GraphQLNonNull(GraphQLID),
            name: "_id",
            description: "This is the URI identifier of the object.",

        },
        _type: {
            type: GraphQLString,
            name: "_type",
            description: "This is the type URI of the object."
        }
    }
    props = typecandidates[rdfsclass]["props"]

    for (var prop in props) {
        var property = props[prop]
        var propertyName = fieldcandidates[property]["name"]
        var propertyDescription = fieldcandidates[property]["description"]
        var rangeOrg = fieldcandidates[property]["range"]
        var range = []

        for (var n in rangeOrg) {
            if (typecandidates[rangeOrg[n]] != undefined) {
                range.push(rangeOrg[n])
            }
        }

        if (range.length > 0) {
            var rangeName
            var rangeNames = []
            for (var n in range) {
                rangeNames.push(typecandidates[range[n]]["name"])
            }
            rangeNames.sort()
            rangeName = rangeNames.join("_v_")

            if (range.length > 1) {

                if (typeDefs[rangeName] == undefined) {

                    typeDefs[rangeName] = new GraphQLUnionType({
                        name: rangeName,
                        types: () => getSetOfTypesByNames(rangeNames, typeDefs)
                    })

                    // console.log("Adding type: " + rangeName)
                }

            }
            
            if (fieldcandidates[property]["functional"]) {
                fields[propertyName] = {
                    name: propertyName,
                    type: GraphQLString, // getTypeByName(rangeName, typeDefs),
                    description: propertyDescription
                }
            } else {
                fields[propertyName] = {
                    name: propertyName,
                    type: GraphQLString, // new GraphQLList(getTypeByName(rangeName, typeDefs)),
                    description: propertyDescription
                }
            }
        }
    }

    return fields
}


function getQueryFields(typecandidates, typeDefs) {
    var queryFields = new GraphQLField
    for (var rdfsclass in typecandidates) {
        var name = typecandidates[rdfsclass]["name"]

        queryFields[name] = {
            type: new GraphQLList(getTypeByName(name, typeDefs)),
            args: {
                page: {
                    type: GraphQLInt,
                    description: "Which consecutive page of results the query should return."
                }
            },
            // description: "Return objects of type: " + name
        }

    }

    return queryFields

}
function getMutationFields(typecandidates, typeDefs) {
    var mutationFields = {}
    for (var rdfsclass in typecandidates) {
        var name = typecandidates[rdfsclass]["name"]
        mutationFields[name] = {
            type: () => new GraphQLList(getTypeByName(name, typeDefs)),
            args: {
                type: {
                    type: GraphQLString,
                    description: "One of mutation types: INSERT, UPDATE, CREATE, REMOVE."
                }
            }
            // description: "Perform a mutation on an object of type: " + name
        }

    }

    return mutationFields
}


async function process() {

    await database.readFromFile('schema.ttl');

    let schema_spec = {
        "classes": {},
        "properties": {}
    }

    const classes = database.getSubs("http://www.w3.org/2000/01/rdf-schema#Class")
    const datatypes = database.getSubs("http://schema.org/DataType")
    const properties = database.getSubs("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property")
    const functionalProperties = database.getSubs("http://www.w3.org/2002/07/owl#FunctionalProperty")

    schema_spec = await getAllSubclasses(classes, datatypes, schema_spec)

    schema_spec = getIndirectSublasses(schema_spec)

    schema_spec = await processProperties(properties, functionalProperties, schema_spec)

    let typeDefs = {}

    typecandidates = schema_spec["classes"]
    fieldcandidates = schema_spec["properties"]

    for (var rdfsclass in typecandidates) {

        var name = typecandidates[rdfsclass]["name"]
        var description = typecandidates[rdfsclass]["description"]

        if (typecandidates[rdfsclass]["type"] == "Object") {

            typeDefs[name] = new GraphQLObjectType({
                name: name,
                description: description,
                fields: () => ({})//(getObjectFields(rdfsclass, typecandidates, fieldcandidates, typeDefs))
            })

        }

        if (typecandidates[rdfsclass]["type"] == "Data") {
            typeDefs[name] = new GraphQLObjectType({
                name: name,
                description: description,
                fields: {
                    _value: {
                        type: new GraphQLNonNull(GraphQLString),
                        name: "_value",
                        description: "This is the literal data value expressed as string.",

                    },
                    _type: {
                        type: GraphQLString,
                        name: "_type",
                        description: "This is the type URI of this data value."
                    }
                }
            })
        }
    }

    var queryType = new GraphQLObjectType({
        name: 'Query',
        fields: () => (getQueryFields(typecandidates, typeDefs))
    })

    // var mutationType = new GraphQLObjectType({
    //     name: 'Mutation',
    //     fields: () => getMutationFields(typecandidates, typeDefs)
    // })

    var schema = new GraphQLSchema({ query: queryType })


    // const sdl = printSchema(schema);

    // fs.writeFile("schema.graphql", sdl, (err) => {
    //     if (err) console.log(err);
    //     console.log("Successfully Written to File.");
    //   });

    var app = express();
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        rootValue: global,
        graphiql: true,
    }));
    app.listen(4000);
    console.log('Running a GraphQL API server at localhost:4000/graphql');

}

process()