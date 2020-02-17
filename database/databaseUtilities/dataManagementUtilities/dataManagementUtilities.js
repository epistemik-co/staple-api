const read_graphy = require("graphy").content.nq.read;
const factory = require("@graphy/core.data.factory");
const logger = require(`../../../config/winston`);

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
    // remove all staple : datatype 
    let temp = database.database.match(null, null, null);
    let itr = temp.quads();
    let itrData = itr.next();
    while (!itrData.done) {
        if (itrData.value.predicate.value === database.stampleDataType ) {
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

function insertRDFPromise(tree, rdf) {
    return new Promise((resolve) => {
        let data = (y_quad) => { 
                y_quad.graph = factory.namedNode(null);

                // double to string
                if(y_quad.object.datatype && y_quad.object.datatype.value === 'http://www.w3.org/2001/XMLSchema#double' ){
                    y_quad.object.value = parseFloat(y_quad.object.value).toString();
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
 
module.exports = {
    createReverseContext,
    createGraphMap,
    updateInference,
    insertRDFPromise,
    removeRDFPromise, 
};