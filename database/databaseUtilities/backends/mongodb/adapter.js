const MongoClient = require("mongodb").MongoClient;
const logger = require("../../../../config/winston");
const jsonld = require("jsonld");
const util = require("util");

class MongodbAdapter {
    constructor(configFile) {
        this.configFile = configFile;
    }

    /**
     * 
     * Load Core Query Data From DB
     * 
     * @param {graphy} database - in-memory cache for results - graphy
     * @param {string} type uri
     * @param {int} page
     * @param {JSON} selectionSet
     * @param {boolean} inferred
     * @param {JSON} tree
     * @param {JSON} filter
     */

    async loadCoreQueryDataFromDB(database, type, page, selectionSet = undefined, inferred = false, tree = undefined, source,filter,limit) {
        const fieldName = selectionSet.name.value;
        let subTypes = tree[fieldName]["subTypes"];
       // logger.info(`Test limit oK: ${limit}`);
        subTypes = subTypes.map(s => this.removeNamespace(s));
        let query = this.preparefilters(database, selectionSet, tree, filter);
        if (this.client === undefined) {
            this.client = await MongoClient.connect(this.configFile.url, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => { logger.error(err); });
        }

        try {
            const db = this.client.db(this.configFile.dbName);
            let collection = db.collection(this.configFile.collectionName);
            let _type = undefined;

            if (query === undefined) {
                _type = database.schemaMapping["@revContext"][type]; //URI FOR TYPE 
                query = {};
            }

            let result;
            if (inferred) {
                query["_type"] = { "$in": subTypes };
                if (page === undefined) {
                    result = await collection.find(query).toArray();
                }
                else {
                    logger.debug(`Mongo db query:\n${util.inspect(query, false, null, true /* enable colors */)}`);
                    result = await collection.find(query).skip(page * 10 - 10).limit(10).toArray();
                }
            } else {
                if (_type) {
                    query["_type"] = _type;
                }
                if (page === undefined) {
                    result = await collection.find(query).toArray();
                }
                else {
                    logger.debug(`Mongo db query:\n${util.inspect(query, false, null, true /* enable colors */)}`);
                    result = await collection.find(query).skip(page * 10 - 10).limit(10).toArray();
                }
            }

            result = result.map(x => {
                x["@context"] = database.schemaMapping["@context2"];
                return x;
            });

            const rdf = await jsonld.toRDF(result, { format: "application/n-quads" });
            logger.debug("Graphy database rdf insert start");
            await database.insertRDF(rdf);
            logger.debug("Graphy database rdf insert end");

        } catch (err) {
            logger.error(err);
        }

    }

    async loadChildObjectsByUris(database, sub, selection, tree, parentName) {

        logger.log("info", "loadChildObjectsByUris was called");
        if (this.client === undefined) {
            this.client = await MongoClient.connect(this.configFile.url, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => { logger.error(err); });
        }

        try {
            const db = this.client.db(this.configFile.dbName);
            let collection = db.collection(this.configFile.collectionName);

            let query = this.preparefilters(database, selection, tree, parentName);
            if (query === undefined) {
                query = {};
            }

            if (query["_id"] === undefined) {
                query["_id"] = { "$in": sub };
            }

            logger.debug(`Mongo db query:\n${util.inspect(query, false, null, true /* enable colors */)}`);
            let result = await collection.find(query).toArray();

            result = result.map(x => {
                x["@context"] = database.schemaMapping["@context2"];
                return x;
            });

            const rdf = await jsonld.toRDF(result, { format: "application/n-quads" });

            logger.debug("Graphy database rdf insert start");
            await database.insertRDF(rdf);
            logger.debug("Graphy database rdf insert end");


        } catch (err) {
            logger.error(err);
        }
    }

    async pushObjectToBackend(database, input) {

        if (this.client === undefined) {
            this.client = await MongoClient.connect(this.configFile.url, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => { logger.error(err); });
        }

        try {
            const db = this.client.db(this.configFile.dbName);
            let collection = db.collection(this.configFile.collectionName);

            logger.debug(`Mongo db query:\n${util.inspect(input, false, null, true /* enable colors */)}`);

            await collection.updateOne({ "_id": input["_id"] }, { "$set": input }, { upsert: true });

        } catch (err) {
            logger.error(err);
        }
    }

    async removeObject(database, objectIDs) {

        if (this.client === undefined) {
            this.client = await MongoClient.connect(this.configFile.url, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => { logger.error(err); });
        }

        let query = { "_id": { $in: objectIDs } };
        try {
            const db = this.client.db(this.configFile.dbName);
            let collection = db.collection(this.configFile.collectionName);

            logger.debug(`Mongo db query:\n${util.inspect(query, false, null, true /* enable colors */)}`);

            let res = await collection.deleteMany(query);

            return res.result.n;

        } catch (err) {
            logger.error(err);
        }
    }

    preparefilters(database, selection, tree, filter) {

        let query = {};
        let fieldName = selection.name.value;
        let fieldData = tree[fieldName];

        if (fieldData === undefined) {
            return {};
        }

        for (let argument of selection.arguments) {
            if (argument.name.value === "filter") {
                if (argument.value.fields) {
                    for (let filterField of argument.value.fields) {
                        if (fieldData.data[filterField.name.value] !== undefined) {
                            if (filterField.value.kind === "ListValue") {
                                let objectFilterName = filterField.name.value;

                                query[objectFilterName] = {};
                                query[objectFilterName]["$in"] = [];

                                for (let elem of filterField.value.values) {
                                    if (elem.kind === "IntValue") {
                                        query[objectFilterName]["$in"].push(parseInt(elem.value));
                                    }
                                    else if (elem.kind === "FloatValue") {
                                        query[objectFilterName]["$in"].push(parseFloat(elem.value));
                                    }
                                    else {
                                        query[objectFilterName]["$in"].push(elem.value);
                                    }
                                }
                            }
                            else {
                                if (filterField.value.kind === "IntValue") {
                                    query[filterField.name.value] = parseInt(filterField.value.value);
                                }
                                else if (filterField.value.kind === "FloatValue") {
                                    query[filterField.name.value] = parseFloat(filterField.value.value);
                                }
                                else {
                                    query[filterField.name.value] = filterField.value.value;
                                }
                            }
                        }
                        else {
                            logger.debug("SKIP");
                        }
                    }
                }else{
                    let filterKeys = Object.keys(filter);
                    for (let key of filterKeys){
                        if (query[key]){
                            query[key]["$in"] = filter[key];
                        }else{
                            query[key] = {"$in": []};
                            query[key]["$in"] = filter[key];

                        }
                    }
                }
            }
        }

        if (Object.keys(query).length === 0 && query.constructor === Object) {
            return undefined;
        }
        return query;
    }

    removeNamespace(nameWithNamesapace) {
        nameWithNamesapace = String(nameWithNamesapace).split(/([/|#])/);
        nameWithNamesapace = nameWithNamesapace[nameWithNamesapace.length - 1];
        return nameWithNamesapace;
    }
}

module.exports = MongodbAdapter;
