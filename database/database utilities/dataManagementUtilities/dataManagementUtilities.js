const read_graphy = require("graphy").content.nq.read;
const factory = require("@graphy/core.data.factory");
var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

function createReverseContext(schemaMapping) {
    schemaMapping["@revContext"] = {};
    for (let key in schemaMapping["@context"]) {
        schemaMapping["@revContext"][schemaMapping["@context"][key]] = key;
    }
}

function createGraphMap(schemaMapping){
    schemaMapping["@graphMap"] = {};
    for (let object of schemaMapping["@graph"]) {
        if(schemaMapping["@graphMap"][object["@id"]] !== undefined){
            logger.warn(`This ID apears more than once in schema mapping @graph ${schemaMapping["@graphMap"][object["@id"]]}`);
        }
        schemaMapping["@graphMap"][object["@id"]] = object;
    }
}

function updateInference(database) {
    // remove all staple : datatype but not Thing 
    let temp = database.database.match(null, null, null);
    let itr = temp.quads();
    let itrData = itr.next();
    while (!itrData.done) {
        if (itrData.value.predicate.value === database.stampleDataType && itrData.value.object.value !== database.schemaMapping["@context"]["Thing"]) {
            database.database.delete(itrData.value);
        }
        itrData = itr.next();
    }

    // get all quads and foreach type put inferences .... store in array types already putted to db
    temp = database.database.match(null, null, null);
    itr = temp.quads();
    itrData = itr.next();

    while (!itrData.done) {
        if (itrData.value.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
            // let data = database.schemaMapping["@graph"].filter((x) => { return x['@id'] === itrData.value.object.value })
            let data = database.schemaMapping["@graphMap"][itrData.value.object.value];
            if (data !== undefined) {
                let uris = data["http://www.w3.org/2000/01/rdf-schema#subClassOf"];
                for (let x in uris) {
                    database.create(itrData.value.subject.value, database.stampleDataType, uris[x]["@id"]);
                }
            }

        }
        itrData = itr.next();
    }
}

function insertRDFPromise(tree, rdf, schemaMapping, tryToFix = false, uuid) {
    return new Promise((resolve) => {
        let data = (y_quad) => {
            
                if (tryToFix) {
                    y_quad = quadFix(y_quad, uuid);
                }
                y_quad.graph = factory.namedNode(null);

                // add inverses 
                let inverse = schemaMapping["@graphMap"][y_quad.predicate.value];
                if (inverse !== undefined) {
                    if (inverse["http://schema.org/inverseOf"] !== undefined) {
                        inverse["http://schema.org/inverseOf"].forEach(inversePredicate => {
                            let quad = factory.quad(y_quad.object, factory.namedNode(inversePredicate), y_quad.subject, y_quad.graph);
                            tree.add(quad);
                        });
                    }
                }

                tree.add(y_quad);
            
        };

        let eof = () => {
            resolve("done");
        };

        read_graphy(rdf, { data, eof, });
    });
}

function removeRDFPromise(tree, ID, rdf) {
    return new Promise((resolve) => {
        let data = (y_quad) => {
            if (y_quad.subject.value === ID) {
                y_quad.graph = factory.namedNode(null);
                tree.delete(y_quad);
            }
        };

        let eof = () => {
            resolve("done");
        };

        read_graphy(rdf, { data, eof, });
    });
}
// Try to fix quads from some wierd sources
function quadFix(quad, uuid) {
    // stage 1 - blank node 
    // if (quad.subject.value.startsWith("genid") || quad.subject.value.startsWith("node")) {
    //     let value = "http://staple-api.org/data/" + quad.subject.value.substring(5, quad.subject.value.length);
    //     quad.subject = factory.namedNode(value)
    // }
    // if (quad.object.value.startsWith("genid") || quad.object.value.startsWith("node")) {
    //     let value = "http://staple-api.org/data/" + quad.object.value.substring(5, quad.object.value.length);
    //     quad.object = factory.namedNode(value)
    // }

    // eslint-disable-next-line no-useless-escape
    var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if (!pattern.test(quad.subject.value)) {
        let value = "http://staple-api.org/data/" + quad.subject.value;
        if (uuid !== undefined) {
            value = value + uuid;
        }
        quad.subject = factory.namedNode(value);
    }
    if (!pattern.test(quad.object.value) && quad["object"].constructor.name !== "Literal") {
        let value = "http://staple-api.org/data/" + quad.object.value;
        if (uuid !== undefined) {
            value = value + uuid;
        }
        quad.object = factory.namedNode(value);
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
    ];

    let typesMap = {
        "http://www.w3.org/2001/XMLSchema#integer": "http://schema.org/Integer",
        "http://www.w3.org/2001/XMLSchema#double": "http://schema.org/Float",
        "http://www.w3.org/2001/XMLSchema#boolean": "http://schema.org/Boolean",
        "http://www.w3.org/2001/XMLSchema#string": "http://schema.org/Text",
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString": "http://schema.org/Text",
    };


    if (quad.object.datatype !== undefined) {
        if (!typesURI.includes(quad.object.datatype.value)) {
            if (typesMap[quad.object.datatype.value] !== undefined) {
                quad.object.datatype.value = typesMap[quad.object.datatype.value];
            }
            else {
                logger.warn(quad.object.datatype.value);
                quad.object.datatype.value = "http://schema.org/Text";
            }
        } 
    }
    else if(quad["object"].constructor.name === "Literal"){
        quad.object.datatype = {};
        quad.object.datatype.value = "http://schema.org/Text";
    }

    // stage 5 - Remove the 4th element in the quad .
    quad.graph = factory.namedNode(null); 
    return quad;
}

module.exports = {
    createReverseContext,
    createGraphMap,
    updateInference,
    insertRDFPromise,
    removeRDFPromise, 
};