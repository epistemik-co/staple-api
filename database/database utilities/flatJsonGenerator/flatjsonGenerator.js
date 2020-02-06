const factory = require("@graphy/core.data.factory");
var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

// ---=== SUMMARY ===---
// Function takes database as argument and creates flatjson snapshot of it. The object will be saved in database object as flatJsons property and it will be also returned.

async function getFlatJson(database) {
    // find all objects
    let ids = await database.getSubjects();
  
    // for each object in database ...
    for (let i in ids) {
        let id = ids[i];
        let allRelatedQuads = [];

        var temp = database.database.match(factory.namedNode(id), null, null);
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            allRelatedQuads.push(x.value);
            x = itr.next();
        }

        temp = database.database.match(null, null, factory.namedNode(id));
        itr = temp.quads();
        x = itr.next();
        while (!x.done) {
            allRelatedQuads.push(x.value);
            x = itr.next();
        }

        // logger.debug(allRelatedQuads)
        // create json
        let newJson = {
            "_id": id,
            "_type": undefined,
            "_inferred": [], 
        };

        for (let quad of allRelatedQuads) {
            // logger.debug(quad)
            if (quad.subject.value === id) { //type
                if (quad.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    let contextKey = database.schemaMapping["@revContext"][quad.object.value];
                    newJson["_type"] = contextKey;
                }
                else if (quad.object.datatype !== undefined) { //Literal
                    //find key 
                    let fieldKey = quad.predicate.value;
                    //???
                    if (quad.predicate.value === database.schemaMapping["@context"][quad.predicate.value.split("http://schema.org/")[1]]) {
                        fieldKey = quad.predicate.value.split("http://schema.org/")[1];
                    }
                    else {
                        fieldKey = database.schemaMapping["@revContext"][quad.predicate.value];
                    }

                    if (fieldKey !== undefined) {

                        if (newJson[fieldKey] === undefined) {
                            newJson[fieldKey] = [];
                        }

                        newJson[fieldKey].push(quad.object.value);
                    }
                    else {
                        logger.warn(`Unexpected predicate in quad with literal ${quad.predicate.value}`);
                    }

                }
                else if (quad.predicate.value === "http://staple-api.org/datamodel/type") { // _inferred
                    let contextKey = database.schemaMapping["@revContext"][quad.object.value];
                    if (contextKey !== undefined) {
                        newJson["_inferred"].push(contextKey);
                    }
                    else {
                        logger.warn(`Unexpected object in quad: ${quad.object.value}`);
                    }
                }
                else { // object
                    let contextKey = database.schemaMapping["@revContext"][quad.predicate.value];

                    if (contextKey !== undefined) {
                        if (newJson[contextKey] === undefined) {
                            newJson[contextKey] = [];
                        }

                        newJson[contextKey].push({ _id: quad.object.value });
                    }
                    else {
                        logger.warn(`Unexpected predicate in quad: ${quad.predicate.value}`);
                    }
                }
            }
 
        }
        //add flat json to database object
        database.flatJsons.push(newJson);
    } 
    return database.flatJsons;
}

module.exports = { 
    getFlatJson,
};