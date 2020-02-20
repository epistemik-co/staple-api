const DatabaseInterface = require("./database/database");
let database = new DatabaseInterface();
var fs = require("fs");

function processTypes(classes, data, enums, schema_spec) {
    for (var cla in classes) {
        var rdfsclass = classes[cla];
        var n = rdfsclass.lastIndexOf("/");
        var m = rdfsclass.lastIndexOf("#");
        var name = String(rdfsclass.substring(Math.max(m, n) + 1));
        if (name == "Boolean" || name == "String" || name == "Float" || name == "Int" || name == "ID") {
            name = name + "_";
        }

        var description = database.getSingleStringValue(rdfsclass, "http://www.w3.org/2000/01/rdf-schema#comment");

        schema_spec.classes[rdfsclass] = {};
        schema_spec.classes[rdfsclass].name = name;
        schema_spec.classes[rdfsclass].description = description;
        schema_spec.classes[rdfsclass].sub = database.getSubClasses(rdfsclass);
        schema_spec.classes[rdfsclass].sup = [rdfsclass];
        schema_spec.classes[rdfsclass].props = [];
        schema_spec.classes[rdfsclass].propsRev = [];
        schema_spec.classes[rdfsclass].type = "Object";

    }
    for (var d in data) {
        var [_, schema_spec] = getIndirectSublassesOfClass(schema_spec, data[d], true);
    }

    for (var className in schema_spec.classes) {
        var [_, schema_spec] = getIndirectSublassesOfClass(schema_spec, className, false);
    }

    return schema_spec;
}

function getIndirectSublassesOfClass(schema_spec, ofClass, datatype) {
    if (datatype) {
        schema_spec.classes[ofClass].type = "Data";
    }

    var allSubs = [ofClass];
    if (schema_spec.classes[ofClass]) {
        for (let sub of schema_spec.classes[ofClass].sub) {

            schema_spec.classes[sub].sup = union(schema_spec.classes[sub].sup, schema_spec.classes[ofClass].sup);

            if (sub != ofClass) {
                if (!allSubs.includes(sub)) {
                    allSubs.push(sub);
                }
                [moresubs, schema_spec] = getIndirectSublassesOfClass(schema_spec, sub, datatype);

                moresubs.forEach(function (subsub) {
                    if (!allSubs.includes(subsub)) {
                        allSubs.push(subsub);
                    }
                });
            }
        }
        schema_spec.classes[ofClass].sub = allSubs;
    }

    return [allSubs, schema_spec];
}

function processProperties(properties, functionalProperties, schema_spec) {
    for (var prop in properties) {
        var property = properties[prop];
        const range = database.getObjs(property, "http://schema.org/rangeIncludes");
        const domain = database.getObjs(property, "http://schema.org/domainIncludes");
        if (domain.length != 0 && range.length != 0) {

            const description = database.getSingleStringValue(property, "http://www.w3.org/2000/01/rdf-schema#comment");
            var n = property.lastIndexOf("/");
            var m = property.lastIndexOf("#");
            var name = property.substring(Math.max(n, m) + 1);

            schema_spec.properties[property] = {};
            schema_spec.properties[property].range = [];
            schema_spec.properties[property].domain = [];
            schema_spec.properties[property].name = name;
            schema_spec.properties[property].description = description;

            schema_spec.properties[property].objects = false;
            schema_spec.properties[property].data = false;

            for (var r in range) {
                var rangeclass = range[r];
                schema_spec.properties[property].range.push(schema_spec.classes[rangeclass].name);
                if (schema_spec.classes[rangeclass].type == "Object") { // || schema_spec.classes[rangeclass].type == "Enum"
                    schema_spec.properties[property].objects = true;
                } else {
                    schema_spec.properties[property].data = true;
                }

                var inherited = schema_spec.classes[rangeclass].sub;
                if (schema_spec.classes[rangeclass].type == "Object") { // || schema_spec.classes[rangeclass].type == "Enum"
                    for (var i in inherited) {
                        var inheritclass = inherited[i];
                        schema_spec.classes[inheritclass].propsRev.push(property);
                    }
                }
            }

            for (var d in domain) {
                var domainclass = domain[d];
                schema_spec.properties[property].domain.push(schema_spec.classes[domainclass].name);

                // eslint-disable-next-line no-redeclare
                var inherited = schema_spec.classes[domainclass].sub;
                // eslint-disable-next-line no-redeclare
                for (var i in inherited) {
                    // eslint-disable-next-line no-redeclare
                    var inheritclass = inherited[i];
                    schema_spec.classes[inheritclass].props.push(property);
                }
            }

            if (functionalProperties.includes(property)) {
                schema_spec.properties[property].functional = true;
            } else {
                schema_spec.properties[property].functional = false;
            }
        }
    }

    return schema_spec;
}

function union(set1, set2) {
    var set = [];
    for (var x in set1) {
        if (!set.includes(set1[x])) {
            set.push(set1[x]);
        }
    }

    // eslint-disable-next-line no-redeclare
    for (var x in set2) {
        if (!set.includes(set2[x])) {
            set.push(set2[x]);
        }
    }

    return set;
}


async function process(ontology) {
    database = new DatabaseInterface();
    if (ontology.string){
        await database.readFromString(ontology.string);
    }else{
        await database.readFromFile(ontology.file);
    }
    let schema_spec = {
        "classes": {},
        "properties": {}
    };

    var clas = database.getInstances("http://www.w3.org/2000/01/rdf-schema#Class");
    var subs = database.getAllSubs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
    var sups = database.getAllObjs("http://www.w3.org/2000/01/rdf-schema#subClassOf");
    var doms = database.getAllObjs("http://schema.org/domainIncludes");
    var rans = database.getAllObjs("http://schema.org/rangeIncludes");
    var data = database.getInstances("http://schema.org/DataType");

    var classes = union(clas, union(subs, union(sups, union(doms, union(rans, data)))));

    var enums = database.getSubs("http://www.w3.org/2000/01/rdf-schema#subClassOf", "http://schema.org/Enumeration");

    classes = classes.filter(item => item !== "http://www.w3.org/2000/01/rdf-schema#Class");
    classes = classes.filter(item => item !== "http://schema.org/Enumeration");

    var props = database.getInstances("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property");
    var pdoms = database.getAllSubs("http://schema.org/domainIncludes");
    var prans = database.getAllSubs("http://schema.org/rangeIncludes");

    const properties = union(props, union(pdoms, prans));
    const functionalProperties = database.getInstances("http://www.w3.org/2002/07/owl#FunctionalProperty");

    schema_spec = processTypes(classes, data, enums, schema_spec);

    schema_spec = processProperties(properties, functionalProperties, schema_spec);

    var context = {
        "_id": "@id",
        "_type": "@type"
    };

    var context2 = {
        "_id": "@id",
        "_type": "@type"
    };


    var graph = [];
    for (var c in schema_spec.classes) {
        if (schema_spec.classes[c]["name"] != "integer" && schema_spec.classes[c]["name"] != "decimal" && schema_spec.classes[c]["name"] != "boolean" && schema_spec.classes[c]["name"] != "string") {
            if (schema_spec.classes[c].type == "Object") {
                context[schema_spec.classes[c].name] = c;
                context2[schema_spec.classes[c].name] = c;
                graph.push({
                    "@id": c,
                    "@type": "http://www.w3.org/2000/01/rdf-schema#Class",
                    "http://www.w3.org/2000/01/rdf-schema#subClassOf": schema_spec.classes[c].sup.map(function (supClass) {
                        return {
                            "@id": supClass
                        };
                    })
                });

            } else {
                context[schema_spec.classes[c].name] = c;
                context2[schema_spec.classes[c].name] = c;
                graph.push({
                    "@id": c,
                    "@type": "http://schema.org/DataType",
                    "http://www.w3.org/2000/01/rdf-schema#subClassOf": schema_spec.classes[c].sup.map(function (supClass) {
                        return {
                            "@id": supClass
                        };
                    })
                });
            }

        }
    }
    for (var p in schema_spec.properties) {
        context[schema_spec.properties[p].name] = p;
        if (schema_spec.properties[p].range != "integer" && schema_spec.properties[p].range != "string" && schema_spec.properties[p].range != "decimal" && schema_spec.properties[p].range != "boolean"){
            context2[schema_spec.properties[p].name] = {"@id": p, "@type": "@id"};
        }else{
            context2[schema_spec.properties[p].name] = p;
        }
        graph.push({
            "@id": p,
            "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
        });
    }

    const jsonld = {
        "@context": context,
        "@context2": context2,
        "@graph": graph
    };

        return jsonld;
}

module.exports = {
    process: process
};