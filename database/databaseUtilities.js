const read_graphy = require('graphy').content.nq.read;
const factory = require('@graphy/core.data.factory');

function createReverseContext(schemaMapping) {
    schemaMapping['@revContext'] = {};
    for (let key in schemaMapping['@context']) {
        schemaMapping['@revContext'][schemaMapping['@context'][key]] = key;
    }
}

function insertRDFPromise(tree, ID, rdf, schemaMapping, tryToFix = false) {
    return new Promise((resolve, reject) => {
        let data = (y_quad) => {
            if (y_quad.subject.value === ID || ID === undefined) {
                if (tryToFix) {
                    y_quad = quadFix(y_quad)
                }
                y_quad.graph = factory.namedNode(null);

                // add inverses 
                let inverse = schemaMapping['@graph'].filter(x => x["@id"] === y_quad.predicate.value)
                inverse = inverse[0]
                if (inverse !== undefined) {
                    if (inverse['http://schema.org/inverseOf'] !== undefined) {
                        inverse['http://schema.org/inverseOf'].forEach(inversePredicate => {
                            let quad = factory.quad(y_quad.object, factory.namedNode(inversePredicate), y_quad.subject, y_quad.graph);
                            tree.add(quad);
                        })
                    }
                }

                tree.add(y_quad);
            }
        }

        let eof = (h_prefixes) => {
            resolve('done')
        }

        read_graphy(rdf, { data, eof, })
    });
}

function removeRDFPromise(tree, ID, rdf) {
    return new Promise((resolve, reject) => {
        let data = (y_quad) => {
            if (y_quad.subject.value === ID) {
                y_quad.graph = factory.namedNode(null);
                tree.delete(y_quad);
            }
        }

        let eof = (h_prefixes) => {
            resolve('done')
        }

        read_graphy(rdf, { data, eof, })
    });
}

async function getFlatJson(databaseObject) {
    // find all objects
    let ids = await databaseObject.getSubjectsByType("http://schema.org/Thing", databaseObject.stampleDataType);
    // CHECK IF OBJECT ALREADY IN DATABASE IF SO, THEN UPDATE

    for (let i in ids) {
        let id = ids[i]
        let allRelatedQuads = []

        var temp = databaseObject.database.match(factory.namedNode(id), null, null);
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            allRelatedQuads.push(x.value);
            x = itr.next();
        }

        temp = databaseObject.database.match(null, null, factory.namedNode(id));
        itr = temp.quads();
        x = itr.next();
        while (!x.done) {
            allRelatedQuads.push(x.value);
            x = itr.next();
        }

        // console.log(allRelatedQuads)
        //create json
        let newJson = {
            "_id": id,
            "_type": undefined,
            "_inferred": [],
            "_reverse": {},
        }

        for (let quad in allRelatedQuads) {
            quad = allRelatedQuads[quad]
            // console.log(quad)
            if (quad.subject.value === id) {
                if (quad.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    let contextKey = databaseObject.schemaMapping['@revContext'][quad.object.value]
                    newJson["_type"] = contextKey;
                }
                else if (quad.object.datatype !== undefined) { //Literal
                    //find key 
                    let fieldKey = quad.predicate.value;
                    if (quad.predicate.value === databaseObject.schemaMapping["@context"][quad.predicate.value.split("http://schema.org/")[1]]) {
                        fieldKey = quad.predicate.value.split("http://schema.org/")[1];
                    }
                    else {
                        fieldKey = databaseObject.schemaMapping['@revContext'][quad.predicate.value];
                    }
                    if (newJson[fieldKey] === undefined) {
                        newJson[fieldKey] = []
                    }

                    newJson[fieldKey].push({
                        _value: quad.object.value,
                        _type: databaseObject.schemaMapping['@revContext'][quad.object.datatype.value],
                    });
                }
                else if (quad.predicate.value === "http://staple-api.org/datamodel/type") { // _inferred
                    let contextKey = databaseObject.schemaMapping['@revContext'][quad.object.value];
                    newJson['_inferred'].push(contextKey)
                }
                else { // object
                    let contextKey = databaseObject.schemaMapping['@revContext'][quad.predicate.value];

                    if (newJson[contextKey] === undefined) {
                        newJson[contextKey] = []
                    }

                    newJson[contextKey].push({ _id: quad.object.value });
                }
            }

            if (quad.object.value === id) { // _reverse
                let contextKey = databaseObject.schemaMapping['@revContext'][quad.predicate.value];
                if (contextKey === undefined) {
                    contextKey = quad.predicate.value;
                }

                if (newJson['_reverse'][contextKey] === undefined) {
                    newJson['_reverse'][contextKey] = []
                }

                newJson['_reverse'][contextKey].push({ _id: quad.subject.value })
            }
        }
        //add to mongo db
        databaseObject.flatJsons.push(newJson)
    }
    databaseObject.mongodbAddOrUpdate()
    return "DONE"
}

function quadFix(quad) {
    // stage 1 - blank node 
    if (quad.subject.value.startsWith("genid")) {
        let value = "http://staple-api.org/data/" + quad.subject.value.substring(5, quad.subject.value.length);
        quad.subject = factory.namedNode(value)
    }
    if (quad.object.value.startsWith("genid")) {
        let value = "http://staple-api.org/data/" + quad.object.value.substring(5, quad.object.value.length);
        quad.object = factory.namedNode(value)
    }
    // stage 2 - unicode back to ascii
    // it is working just fine for me

    // stage 3 - after this validation 

    // stage 4 - Fix http://schema.org/DataType
    let typesURI = [
        "http://schema.org/Boolean",
        "http://schema.org/Date",
        "http://schema.org/DateTime",
        "http://schema.org/Float",
        "http://schema.org/Integer",
        "http://schema.org/Number",
        "http://schema.org/Text",
        "http://schema.org/Time",
        "http://schema.org/URL",
    ]

    let typesMap = {
        "http://www.w3.org/2001/XMLSchema#integer": "http://schema.org/Integer",
        "http://www.w3.org/2001/XMLSchema#double": "http://schema.org/Float",
        "http://www.w3.org/2001/XMLSchema#boolean": "http://schema.org/Boolean",
        "http://www.w3.org/2001/XMLSchema#string": "http://schema.org/Text",
    }


    if (quad.object.datatype !== undefined) {

        if (!typesURI.includes(quad.object.datatype.value)) {
            if (typesMap[quad.object.datatype.value] !== undefined) {
                quad.object.datatype.value = typesMap[quad.object.datatype.value];
            }
            else {
                console.log(quad.object.datatype.value)
                quad.object.datatype.value = "http://schema.org/Text";
            }
        }
    }

    // stage 5 - Remove the 4th element in the quad .
    quad.graph = factory.namedNode(null);

    return quad;
}

module.exports = {
    createReverseContext,
    insertRDFPromise,
    removeRDFPromise,
    getFlatJson,
};