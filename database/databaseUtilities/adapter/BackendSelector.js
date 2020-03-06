const logger = require("../../../config/winston");

class BackendSelector {

    constructor(schemaMapping, configObject) {
        let adapterType = undefined;
        //list of all backends that can be used in app
        this.backend = {};
        //default datasource, when no source has been provided in query
        this.defaultDatasource = configObject.dataSources.default ? configObject.dataSources.default : "memory";
        let dataSourcesKeys = Object.keys(configObject.dataSources);
        for (let d of dataSourcesKeys) {
            //if memory in type, add new memory adapter
            if (configObject.dataSources[d].type == "memory") {
                logger.debug("Adding new in-memory database adapter...");
                adapterType = require("../backends/memory/adapter");
                this.backend[d] = new adapterType(schemaMapping);
            }
            //if mongodb in type, add new mongodb adapter
            if (configObject.dataSources[d].type == "mongodb") {
                logger.info("Adding new mongodb adapter...");
                adapterType = require("../backends/mongodb/adapter");
                let configObjectMongo = configObject.dataSources[d];
                this.backend[d] = new adapterType(configObjectMongo);
            }
            //if sparql in type, add new sparql adapter
            if (configObject.dataSources[d].type == "sparql")  {
                logger.info("Adding new sparql adapter...");
                adapterType = require("../backends/sparql/adapter");
                let configObjectSparql = configObject.dataSources[d];
                this.backend[d] = new adapterType(configObjectSparql);
            }
        }
    }

    /**
     * loadCoreQueryDataFromDB
     * @param {database} graphy database
     * @param {type} type of object - uri
     * @param {page} pagination
     * @param {selectionSet} graphQL query
     * @param {inferred} boolean, true if inferred types are expected
     * @param {tree} structure describing data
     * @param {source} datasource that should be used for the query
     */

    async loadCoreQueryDataFromDB(database, type, page = undefined, selectionSet = undefined, inferred = false, tree = undefined, source = this.defaultDatasource) {
        logger.debug(`BackendSelector: loadCoreQueryDataFromDB was called with source: ${source}`);
        if (!(Array.isArray(source))) {
            if (this.backend[source] !== undefined) {
                await this.backend[source].loadCoreQueryDataFromDB(database, type, page, selectionSet, inferred, tree, source);
            } else {
                throw Error(`BackendSelector: loadCoreQueryDataFromDB: Wrong data source name: ${source}`);
            }
        } else {
            for (let sourceName in source) {
                logger.debug(`BackendSelector: loadCoreQueryDataFromDB: Now loading data from: ${source[sourceName]}`);
                if (this.backend[source[sourceName]] !== undefined) {
                    await this.backend[source[sourceName]].loadCoreQueryDataFromDB(database, type, page, selectionSet, inferred, tree, source);
                } else {
                    throw Error(`BackendSelector: loadCoreQueryDataFromDB: Wrong data source name: ${source[sourceName]}`);
                }
            }
        }
    }

    //loads child object from given source by ID
    async loadChildObjectsByUris(database, sub, selection, tree, parentName, source = this.defaultDatasource) {
        logger.debug(`BackendSelector: loadChildObjectsByUris was called with source: ${source}`);
        if (this.backend[source]) {
            await this.backend[source].loadChildObjectsByUris(database, sub, selection, tree, parentName, source);
        }
    }

    //loads objects by uri from given source
    async loadObjectsByUris(database, sub, source = this.defaultDatasource) {
        logger.debug(`BackendSelector: loadObjectsByUris was called with source: ${source}`);
        if (this.backend[source]) {
            await this.backend[source].loadObjectsByUris(database, sub, source);
        }
    }

    //inserts object to db
    async pushObjectToBackend(database, input, source = this.defaultDatasource) {
        if (Array.isArray(source)){
            for (let s of source){
                if (this.backend[s]) {
                    await this.backend[s].pushObjectToBackend(database, input);
                }
            }
        }else{
            if (this.backend[source]) {
                await this.backend[source].pushObjectToBackend(database, input);
            }
        }
    }

    //removes objects from source, ObjectID is a list of ids to be deleted
    async removeObject(database, objectID, source = this.defaultDatasource) {
        logger.info("removeObject was called");

        if (Array.isArray(source)){
            for (let s of source){
                if (this.backend[s]) {
                    await this.backend[s].removeObject(this, objectID);
                }
            }
            return true;
        }else{
            if (this.backend[source]) {
                return await this.backend[source].removeObject(this, objectID);
            }
        }
    }

}

module.exports = BackendSelector;