const {
    printSchema,
    buildClientSchema
} = require("graphql");
const {
    getObjectType,
    getObjectReverseType,
    getInputSingleField,
    getInputListField,
    getUnionType,
    getInputObjectType,
    getInputName,
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
} = require("./introspection-patterns.js")
const DatabaseInterface = require('./database/database');
let database = new DatabaseInterface();
var express = require('express');
var graphqlHTTP = require('express-graphql');
var fs = require('fs');


function processTypes(classes, data, enums, schema_spec) {
    for (var cla in classes) {
        var rdfsclass = classes[cla]
        var n = rdfsclass.lastIndexOf('/');
        var m = rdfsclass.lastIndexOf('#');
        var name = rdfsclass.substring(Math.max(m, n) + 1);

        if (name == "Boolean" || name == "String" || name == "Float" || name == "Int" || name == "ID") {
            name = name + "_"
        }

        var description = database.getSingleStringValue(rdfsclass, "http://www.w3.org/2000/01/rdf-schema#comment");

        schema_spec.classes[rdfsclass] = {}
        schema_spec.classes[rdfsclass].name = name
        schema_spec.classes[rdfsclass].description = description
        schema_spec.classes[rdfsclass].sub = database.getSubClasses(rdfsclass)
        schema_spec.classes[rdfsclass].sup = [rdfsclass]
        schema_spec.classes[rdfsclass].props = []
        schema_spec.classes[rdfsclass].propsRev = []
        schema_spec.classes[rdfsclass].type = "Object"

    }

    for (var d in data) {
        var [_, schema_spec] = getIndirectSublassesOfClass(schema_spec, data[d], true)
    }

    // for (var e in enums) {
    //     schema_spec.classes[enums[e]].type = "Enum"
    // }

    var [_, schema_spec] = getIndirectSublassesOfClass(schema_spec, "http://schema.org/Thing", false)

    return schema_spec
}

function getIndirectSublassesOfClass(schema_spec, ofClass, datatype) {

    if (datatype) {
        schema_spec.classes[ofClass].type = "Data"
    }

    var allSubs = [ofClass]
    schema_spec.classes[ofClass].sub.forEach(function (sub) {

        schema_spec.classes[sub].sup = union(schema_spec.classes[sub].sup, schema_spec.classes[ofClass].sup)

        if (sub != ofClass) {
            if (!allSubs.includes(sub)) {
                allSubs.push(sub)
            }
            [moresubs, schema_spec] = getIndirectSublassesOfClass(schema_spec, sub, datatype)

            moresubs.forEach(function (subsub) {
                if (!allSubs.includes(subsub)) {
                    allSubs.push(subsub)
                }
            })
        }
    })
    schema_spec.classes[ofClass].sub = allSubs
    return [allSubs, schema_spec]
}

function processProperties(properties, functionalProperties, inverseFunctionalProperties, schema_spec) {
    for (prop in properties) {
        var property = properties[prop]
        const range = database.getObjs(property, "http://schema.org/rangeIncludes")
        const domain = database.getObjs(property, "http://schema.org/domainIncludes")
        const inverses1 = database.getObjs(property, "http://schema.org/inverseOf")
        const inverses2 = database.getSubs("http://schema.org/inverseOf", property)
        const inverses = union(inverses1, inverses2)
        if (domain.length != 0 && range.length != 0) {

            const description = database.getSingleStringValue(property, "http://www.w3.org/2000/01/rdf-schema#comment");
            var n = property.lastIndexOf('/');
            var m = property.lastIndexOf('#');
            var name = property.substring(Math.max(n, m) + 1);

            schema_spec.properties[property] = {}
            schema_spec.properties[property].range = []
            schema_spec.properties[property].domain = []
            schema_spec.properties[property].inverses = inverses
            schema_spec.properties[property].name = name
            schema_spec.properties[property].description = description

            schema_spec.properties[property].objects = false
            schema_spec.properties[property].data = false

            for (var r in range) {
                var rangeclass = range[r]
                schema_spec.properties[property].range.push(schema_spec.classes[rangeclass].name)
                if (schema_spec.classes[rangeclass].type == "Object") { // || schema_spec.classes[rangeclass].type == "Enum"
                    schema_spec.properties[property].objects = true
                } else {
                    schema_spec.properties[property].data = true
                }

                var inherited = schema_spec.classes[rangeclass].sub
                if (schema_spec.classes[rangeclass].type == 'Object') { // || schema_spec.classes[rangeclass].type == "Enum"
                    for (var i in inherited) {
                        var inheritclass = inherited[i]
                        schema_spec.classes[inheritclass].propsRev.push(property)
                    }
                }
            }

            for (var d in domain) {
                var domainclass = domain[d]
                schema_spec.properties[property].domain.push(schema_spec.classes[domainclass].name)

                var inherited = schema_spec.classes[domainclass].sub
                for (var i in inherited) {
                    var inheritclass = inherited[i]
                    schema_spec.classes[inheritclass].props.push(property)
                }
            }

            if (functionalProperties.includes(property)) {
                schema_spec.properties[property].functional = true
            } else {
                schema_spec.properties[property].functional = false
            }

            if (inverseFunctionalProperties.includes(property)) {
                schema_spec.properties[property].inverseFunctional = true
            } else {
                schema_spec.properties[property].inverseFunctional = false
            }
        }
    }

    return schema_spec
}

function generatePropertyDefs(schema_spec, typeDefs) {
    var properties = schema_spec.properties

    for (var puri in properties) {
        var property = properties[puri]
        var name = property.name
        var description = property.description
        var rangeName = getRangeName(property.range)
        var domainName = getRangeName(property.domain)

        if (property.functional) {
            property.field = getSingleField(name, description, rangeName, false)
            property.inputField = getInputSingleField(name, description)
        } else {
            property.field = getListField(name, description, rangeName, false)
            property.inputField = getInputListField(name, description)
        }

        if (property.inverseFunctional) {
            property.fieldRev = getSingleField(name, description, domainName, true)
        } else {
            property.fieldRev = getListField(name, description, domainName, true)
        }

        typeDefs[getInputName(name)] = getInputRangeType(name, property.objects, property.data, property.range)
        typeDefs[getTypesName(name)] = getEnumType(property.range)

        if (property.range.length > 1 && typeDefs[rangeName] == undefined) {
            typeDefs[rangeName] = getUnionType(property.range)
        }

        if (property.domain.length > 1 && typeDefs[domainName] == undefined) {
            typeDefs[domainName] = getUnionType(property.domain)
        }
    }

    return typeDefs
}

function generateTypeDefs(schema_spec, typeDefs) {
    var classes = schema_spec.classes

    for (var curi in classes) {
        var clas = classes[curi]
        var name = clas.name
        var description = clas.description
        var entails = superTypeNames(schema_spec, name, clas.sup)

        if (clas.type == "Object") {
            var fields = []
            var inputFields = []
            for (p in clas.props) {
                var property = clas.props[p]
                fields.push(schema_spec.properties[property].field)
                inputFields.push(schema_spec.properties[property].inputField)
            }
            
            typeDefs[getInputName(name)] = getInputObjectType(name, description, inputFields, entails)

            if (clas.propsRev.length > 0) {
                
                typeDefs[name] = getObjectType(name, description, fields, entails, true)

                var fieldsRev = []
                for (p in clas.propsRev) {
                    var property = clas.propsRev[p]
                    fieldsRev.push(schema_spec.properties[property].fieldRev)
                }

                typeDefs[getReverseTypeName(name)] = getObjectReverseType(name, fieldsRev)
            } else {
                typeDefs[name] = getObjectType(name, description, fields, entails, false)
            }

        } 
        
        // if (clas.type == "Enum") {
        //     var instances = database.getInstances(curi)
        //     var values = instances.map(item => {
        //         var n = item.lastIndexOf('/');
        //         var m = item.lastIndexOf('#');
        //         var name = item.substring(Math.max(m, n) + 1);
        //         return name
        //     });
        //     typeDefs[name] = getEnumSchemaType(name, description, values)
        // } 
        
        else {
            typeDefs[name] = getDataType(name, description, entails)
        }
    }

    return typeDefs
}

function superTypeNames(schema_spec, name, supertypes) {
    var names = []
    for (var c in supertypes) {
        var clas = supertypes[c]
        if (schema_spec.classes[clas].name !== name) {
            names.push(schema_spec.classes[clas].name)
        }
    }
    return names
}

function union(set1, set2) {
    var set = []
    for (var x in set1) {
        if (!set.includes(set1[x])) {
            set.push(set1[x])
        }
    }

    for (var x in set2) {
        if (!set.includes(set2[x])) {
            set.push(set2[x])
        }
    }

    return set
}


async function process(schemaText) {
    database = new DatabaseInterface();
    try {
        await database.read(schemaText);
    } catch (error) {
        return {'Error': "Could not compile! Correct your ontology and try again. "}
    }

    const readonly = false;

    let schema_spec = {
        "classes": {},
        "properties": {}
    }

    var clas = database.getInstances("http://www.w3.org/2000/01/rdf-schema#Class")
    var subs = database.getAllSubs("http://www.w3.org/2000/01/rdf-schema#subClassOf")
    var sups = database.getAllObjs("http://www.w3.org/2000/01/rdf-schema#subClassOf")
    var doms = database.getAllObjs("http://schema.org/domainIncludes")
    var rans = database.getAllObjs("http://schema.org/rangeIncludes")
    var data = database.getInstances("http://schema.org/DataType")

    var classes = union(clas, union(subs, union(sups, union(doms, union(rans, data)))))

    var enums = database.getSubs("http://www.w3.org/2000/01/rdf-schema#subClassOf", "http://schema.org/Enumeration")

    classes = classes.filter(item => item !== "http://www.w3.org/2000/01/rdf-schema#Class")
    classes = classes.filter(item => item !== "http://schema.org/Enumeration")

    var props = database.getInstances("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property")
    var pdoms = database.getAllSubs("http://schema.org/domainIncludes")
    var prans = database.getAllSubs("http://schema.org/rangeIncludes")

    const properties = union(props, union(pdoms, prans))
    const functionalProperties = database.getInstances("http://www.w3.org/2002/07/owl#FunctionalProperty")
    const inverseFunctionalProperties = database.getInstances("http://www.w3.org/2002/07/owl#InverseFunctionalProperty")

    schema_spec = processTypes(classes, data, enums, schema_spec)

    schema_spec = processProperties(properties, functionalProperties, inverseFunctionalProperties, schema_spec)

    let typeDefs = {}

    typeDefs = generatePropertyDefs(schema_spec, typeDefs)
    typeDefs = generateTypeDefs(schema_spec, typeDefs)

    // console.log(JSON.stringify(typeDefs, null, 2))

    var types = []
    for (var def in typeDefs) {
        if (readonly) {
            if (typeDefs[def].kind != "INPUT_OBJECT" && typeDefs[def].kind != "ENUM") {
                types.push(typeDefs[def])    
            }
        }
        else {
            types.push(typeDefs[def])
        }
    }

    var objectTypeNames = []
    var dataTypeNames = []

    var context = {
        "_id": "@id",
        "_value": "@value",
        "_type": "@type",
        "_reverse": "@reverse"
    }

    // var schema_spec_json = JSON.stringify(schema_spec, null, 2)
    // console.log(schema_spec_json)

    var graph = []

    for (var c in schema_spec.classes) {
        if (schema_spec.classes[c].type == "Object") {
            objectTypeNames.push(schema_spec.classes[c].name)
            context[schema_spec.classes[c].name] = c
            graph.push({
                "@id": c,
                "@type": "http://www.w3.org/2000/01/rdf-schema#Class",
                "http://www.w3.org/2000/01/rdf-schema#subClassOf": schema_spec.classes[c].sup.map(function (supClass) {
                    return {
                        "@id": supClass
                    }
                })
            })

        } else {
            dataTypeNames.push(schema_spec.classes[c].name)
            context[schema_spec.classes[c].name] = c
            graph.push({
                "@id": c,
                "@type": "http://schema.org/DataType",
                "http://www.w3.org/2000/01/rdf-schema#subClassOf": schema_spec.classes[c].sup.map(function (supClass) {
                    return {
                        "@id": supClass
                    }
                })
            })
        }

    }
    for (var p in schema_spec.properties) {
        context[schema_spec.properties[p].name] = p
        graph.push({
            "@id": p,
            "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
            "http://schema.org/inverseOf": schema_spec.properties[p].inverses
        })
    }


    const queryType = getQueryType(objectTypeNames)
    const mutationType = getMutationType(objectTypeNames)
    const objectTypesEnum = getObjectTypesEnum(objectTypeNames)
    const dataTypesEnum = getDataTypesEnum(dataTypeNames)
    const contextType = getContextObject(context)
    const objectType = getObjectObject()

    types = types.concat(queryType)
    if (!readonly) {
        types = types.concat(mutationType)
    }
    types = types.concat(objectTypesEnum)
    if (dataTypeNames.length > 0) {
        types = types.concat(dataTypesEnum)
    }
    types = types.concat(contextType)
    types = types.concat(objectType)



    const introspectionSchemaDef = getSchemaObject(types, readonly)

    const jsonld = {
        "@context": context,
        "@graph": graph
    };

    const schema = buildClientSchema(introspectionSchemaDef);
    const sdl = printSchema(schema);
 
    return {"schema": sdl, "context": jsonld};

}

// process()
module.exports = process;