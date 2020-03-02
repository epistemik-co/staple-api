const logger = require("../../../config/winston");

class BackendSelector {
    // this.backend contains object with methods implemented for specific backend
    constructor(schemaMapping, configObject) {
        let adapterType = undefined;
        this.backend = {};
        this.defaultDatasource = configObject.dataSources.default ? configObject.dataSources.default : "memory";

        //TODO: decide how to set up in-memory db
        if (configObject.dataSources === undefined || configObject.dataSources.memory) {
            logger.debug("You are using in memory database!");
            adapterType = require("../backends/memory/adapter");
            this.backend.memory = new adapterType(schemaMapping);
            // return;
        }
        //if mongodb in config, use mongodb
        if (configObject.dataSources.mongodb) {
            logger.info("You are using mongodb");
            adapterType = require("../backends/mongodb/adapter");
            this.backend.mongodb = new adapterType(configObject);
        }
        //if sparql in config, use sparql
        if (configObject.dataSources.sparql) {
            logger.info("You are using sparql");
            adapterType = require("../backends/sparql/adapter");
            this.backend.sparql = new adapterType(configObject);
        }
        // else if(configObject.type === "mysql"){ ... }

        // logger.info("DBAdapterSelector ready");
    }

    // QUERY SECTION
    // loadCoreQueryDataFromDB
    // Arguments :
    // database - graphy database
    // type - type of object ( URI )
    // page - selected page of data
    // selectionSet - graphql query
    // inferred - true if inferred types are expected
    // tree - structure describing data
    async loadCoreQueryDataFromDB(database, type, page = undefined, selectionSet = undefined, inferred = false, tree = undefined, source=this.defaultDatasource) {
        logger.debug(`BackendSelector: loadCoreQueryDataFromDB was called with source: ${source}`);
        if (source.lenght == 1){
            if (this.backend[source]) {
                await this.backend[source].loadCoreQueryDataFromDB(database, type, page, selectionSet, inferred, tree);
            }
        }else{
            logger.warn(`Trying to use multiple datasources`)
            for (let sourceName in source){
                logger.warn(`Now loading data from: ${source}`)
                await this.backend[source[sourceName]].loadCoreQueryDataFromDB(database, type, page, selectionSet, inferred, tree);
            }
        }
    }
    async loadChildObjectsByUris(database, sub, selection, tree, parentName, source=this.defaultDatasource) {
        logger.debug(`BackendSelector: loadChildObjectsByUris was called with source: ${source}`);
        if (this.backend[source]) {
            await this.backend[source].loadChildObjectsByUris(database, sub, selection, tree, parentName);
        }
    }

    // sub = [ ... ]
    async loadObjectsByUris(database, sub, source=this.defaultDatasource) {
        logger.debug(`BackendSelector: loadObjectsByUris was called with source: ${source}`);
        if (this.backend[source]) {
            await this.backend[source].loadObjectsByUris(database, sub);
        }
    }

    // sub = [ ... ]
    async pushObjectToBackend(database, input, source=this.defaultDatasource) { 
        if (this.backend[source]) {
            await this.backend[source].pushObjectToBackend(database, input);
        }
    }

    //removes objects from db. ObjectID is a list of ids
    async removeObject(database, objectID, source=this.defaultDatasource){
        logger.info("removeObject was called"); 
        if (this.backend[source]) {
            return await this.backend[source].removeObject(this, objectID);
        } 
    }
 
}

module.exports = BackendSelector;