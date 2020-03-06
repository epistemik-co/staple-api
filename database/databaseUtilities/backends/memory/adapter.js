
const dataset_tree = require("graphy").util.dataset.tree;
const factory = require("@graphy/core.data.factory");
// const databaseUtilities = require("../../database utilities/dataManagementUtilities/dataManagementUtilities"); 
const logger = require("../../../../config/winston");
const databaseUtilities = require("./Utilities");
const jsonld = require("jsonld");

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class MemoryDatabase {
    constructor(schemaMapping) {
        this.schemaMapping = schemaMapping;

        this.database = dataset_tree();
        this.stapleDataType = "http://staple-api.org/datamodel/type";

        this.flatJsons = [];
        this.dbCallCounter = 0;

        // this.loadFakeData();
        logger.log("info", "Database is ready to use");

    }

    async loadCoreQueryDataFromDB(database, type, page = undefined, selection = undefined, inferred = false, tree = undefined) {
        // search selectionSet for core objects load them
        let fieldName = selection.name.value;
        let fieldData = tree[fieldName];

        if (fieldName === undefined) {
            logger.error("Could not find type of object");
            return undefined;
        }

        // all ids
        const subTypes = tree[fieldName]["subTypes"];
        let ids = await this.getSubjectsByType(type, subTypes, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", inferred, page);

        // filter
        if (fieldData) {
            ids = this.preparefilters(ids, fieldData, selection);
        }

        // Add to graphy 
        for (let sub of ids) {
            sub = factory.namedNode(sub);

            const temp = this.database.match(sub, null, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                database.database.add(x.value);
                x = itr.next();
            }
        }
        // console.log(util.inspect(selection, false, null, true));

        return;
    }

    preparefilters(ids, fieldData, selection) {
        let newIds = ids;
        for (let argument of selection.arguments) {
            if (argument.name.value === "filter") {
                for (let filterField of argument.value.fields) {
                    logger.debug("OBJECT");
                    logger.debug(filterField);
                    logger.debug("\n\n");
                    if (fieldData.data[filterField.name.value] !== undefined) {
                        logger.debug("ADD TO THE FILTER QUERY");
                        logger.debug(fieldData.data[filterField.name.value]);
                        let uri = fieldData.data[filterField.name.value].uri;
                        let value = filterField.value;

                        if (value.kind === "ListValue") {
                            value = value.values.map(x => x.value.toString());
                        }
                        else {
                            value = [value.value.toString()];
                        }

                        if (uri === "@id") {
                            logger.debug(value);
                            newIds = newIds.filter(x => value.includes(x));
                        }
                        else {
                            // value or child id?
                            logger.debug(value);
                            logger.debug(uri);
                            newIds = newIds.filter(x => {
                                let propValue = this.getSingleLiteral(x, uri);
                                logger.debug(propValue);
                                if (value.includes(propValue.value)) {
                                    return true;
                                }
                                return false;
                            });
                        }
                    }
                    else {
                        console.log("SKIP");
                    }
                }
            }
        }
        return newIds;
    }

    async loadChildObjectsByUris(database, sub, selection /*, tree, parentName*/) {
        // search selectionSet for core objects load them
        let fieldName = selection.name.value;

        if (fieldName === undefined) {
            logger.error("Could not find type of object");
            return undefined;
        }

        for (let subject of sub) {
            subject = factory.namedNode(subject);
            const temp = this.database.match(subject, null, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) { 
                database.database.add(x.value);
                x = itr.next();
            }
        }

        return;
    }

    async loadObjectsByUris(database, sub) {
        // search selectionSet for core objects load them

        for (let subject of sub) {
            subject = factory.namedNode(subject);
            const temp = this.database.match(subject, null, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                database.database.add(x.value);
                x = itr.next();
            }
        }

        return;
    }

    async pushObjectToBackend(database, input) {
        let objectID = input["_id"];
        this.deleteID(objectID);
        input["@context"] = database.schemaMapping["@context2"];
        const rdf = await jsonld.toRDF(input, { format: "application/n-quads" });
        await this.insertRDF(rdf);
        return;
    }


    async removeObject(database, objectIDs) {
        for (var id of objectIDs) {
            this.deleteID(id);
        }
        return true;
    }

    
    create(sub, pred, obj, gra = null) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object") {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);

        let quad = factory.quad(sub, pred, obj, gra);
        this.database.add(quad);
        return true;
    }

    // returns array of uri - Core Query
    async getSubjectsByType(type, subTypes, predicate, inferred = false, page = undefined) {
        type = factory.namedNode(type);
        let i = 0;

        predicate = factory.namedNode(predicate);
        let data = [];

        if (inferred) {
            for (let subType of subTypes) {
                type.value = subType
                let temp = this.database.match(null, predicate, type);
                var itr = temp.quads();
                var x = itr.next();
                while (!x.done) {
                    i++;
                    if (page) {
                        if (i > (page - 1) * 10) {
                            data.push(x.value.subject.value);
                        }
                        if (i + 1 > page * 10) {
                            break;
                        }
                    }
                    else {
                        data.push(x.value.subject.value);
                    }
                    x = itr.next();
                }
            }
        } else {
            let temp = this.database.match(null, predicate, type);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                i++;
                if (page) {
                    if (i > (page - 1) * 10) {
                        data.push(x.value.subject.value);
                    }
                    if (i + 1 > page * 10) {
                        break;
                    }
                }
                else {
                    data.push(x.value.subject.value);
                }
                x = itr.next();
            }
        }
        return data;
    }

    getSingleLiteral(sub, pred) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        var itr = temp.quads();
        var x = itr.next();

        if (x.value === undefined) {
            return null;
        }

        return x.value.object;
    }


    async insertRDF(rdf) {
        await databaseUtilities.insertRDFPromise(this.database, rdf);
        databaseUtilities.updateInference(this);
    }

    async removeRDF(rdf, ID) {
        await databaseUtilities.removeRDFPromise(this.database, ID, rdf);
        databaseUtilities.updateInference(this);
    }

    // returns all quads
    getAllQuads() {
        const temp = this.database.match(null, null, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
            x = itr.next();
        }
        return data;
    }

    // returns boolean 
    deleteID(id) {
        id = factory.namedNode(id);

        let removed = false;
        var temp = this.database.match(id, null, null);
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            this.database.delete(x.value);
            removed = true;
            x = itr.next();
        }
        return removed;
    }


}

module.exports = MemoryDatabase;