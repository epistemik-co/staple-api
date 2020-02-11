const MongoClient = require("mongodb").MongoClient;
var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

/* eslint-disable require-atomic-updates */
const jsonld = require("jsonld");
const util = require("util");

class MongodbAdapter {
    constructor(configFile) {
        this.configFile = configFile;
    }

    async loadCoreQueryDataFromDB(database, type, page = 1, selectionSet = undefined, inferred = false, tree = undefined) {

        let query = this.preparefilters(database, selectionSet, tree);
        if (this.client === undefined) {
            this.client = await MongoClient.connect(this.configFile.url, { useNewUrlParser: true }).catch(err => { logger.error(err); });
        }

        try {
            const db = this.client.db(this.configFile.dbName);
            let collection = db.collection(this.configFile.collectionName);
            let _type = undefined;

            if (query === undefined) {
                _type = database.schemaMapping["@revContext"][type];
                query = {};
            }

            if (_type !== undefined) {
                if (inferred) {
                    query["_inferred"] = _type;
                }
                else {
                    query["_type"] = _type;
                }
            }

            logger.debug(`Mongo db query:\n${util.inspect(query, false, null, true /* enable colors */)}`);
            let result = await collection.find(query).skip(page * 10 - 10).limit(10).toArray();

            result = result.map(x => {
                x["@context"] = database.schemaMapping["@context"];
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
            this.client = await MongoClient.connect(this.configFile.url, { useNewUrlParser: true }).catch(err => { logger.error(err); });
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
                x["@context"] = database.schemaMapping["@context"];
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
            this.client = await MongoClient.connect(this.configFile.url, { useNewUrlParser: true }).catch(err => { logger.error(err); });
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

    preparefilters(database, selection, tree) {
        // console.log(util.inspect(selection,false,null,true)) 
        let query = {};
        let fieldName = selection.name.value;
        let fieldData = tree[fieldName];

        if (fieldData === undefined) {
            return {};
        }

        for (let argument of selection.arguments) {
            if (argument.name.value === "filter") {
                for (let filterField of argument.value.fields) {
                    // console.log("OBJECT");
                    // console.log(filterField);
                    // console.log("\n\n");
                    if (fieldData.data[filterField.name.value] !== undefined) {
                        // console.log("ADD TO THE FILTER QUERY");
                        if (filterField.value.kind === "ListValue") {
                            let objectFilterName = filterField.name.value;

                            query[objectFilterName] = {};
                            query[objectFilterName]["$in"] = [];

                            for (let elem of filterField.value.values) {
                                if (elem.kind === "IntValue") {
                                    query[objectFilterName]["$in"].push( parseInt(elem.value) );
                                }
                                else if (elem.kind === "FloatValue") {
                                    query[objectFilterName]["$in"].push( parseFloat(elem.value) );
                                }
                                else {
                                    query[objectFilterName]["$in"].push( elem.value );
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
            }
        }

        if (Object.keys(query).length === 0 && query.constructor === Object) {
            return undefined;
        }
        return query;
    }
}

module.exports = MongodbAdapter;