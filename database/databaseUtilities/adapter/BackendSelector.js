const logger = require("../../../config/winston");

class BackendSelector {
    // this.backend contains object with methods implemented for specyfic backend
//TODO: change configObject handling
    constructor(schemaMapping, configObject) {
        let adapterType = undefined;
        this.backend = {};

        if (configObject.dataSources === undefined) {
            logger.debug(configObject.dataSources[0])
            logger.warn("You are using in memory database!");
            adapterType = require("../backends/memory/adapter");
            this.backend.memory = new adapterType(schemaMapping);
            return;
        }

        if (configObject.dataSources.mongodb) {
            logger.info("You are using mongodb");
            adapterType = require("../backends/mongodb/adapter");
            this.backend.mongodb = new adapterType(configObject);
        }

        if (configObject.dataSources.sparql) {
            logger.info("You are using sparql");
            adapterType = require("../backends/sparql/adapter");
            this.backend.sparql = new adapterType(configObject);
        }
        // else if(configObject.type === "mysql"){ ... }

        logger.info("DBAdapterSelector ready");
    }

    // QUERY SECTION
    // loadCoreQueryDataFromDB loads only 10 objects from database
    // Arguments :
    // database - graphy database
    // type - type of object ( URI )
    // page - selected page of data
    // selectionSet - graphql query
    // inferred - true if inferred types are expected
    // tree - structure describing data
    async loadCoreQueryDataFromDB(database, type, page = undefined, selectionSet = undefined, inferred = false, tree = undefined, source= "mongodb") {
        if (this.backend[source]) {
            await this.backend[source].loadCoreQueryDataFromDB(database, type, page, selectionSet, inferred, tree);
        }
    }

    async loadChildObjectsByUris(database, sub, selection, tree, parentName, source="mongodb") {
        if (this.backend[source]) {
            await this.backend[source].loadChildObjectsByUris(database, sub, selection, tree, parentName);
        }
    }

    // sub = [ ... ]
    async loadObjectsByUris(database, sub) {
        if (this.backend) {
            await this.backend.loadObjectsByUris(database, sub);
        }
    }

    // sub = [ ... ]
    async pushObjectToBackend(database, input, source="mongodb") { 
        if (this.backend["source"]) {
            await this.backend.pushObjectToBackend(database, input);
        }
    }

    //removes objects from db. ObjectID is a list of ids
    async removeObject(database, objectID, source="mongodb"){
        logger.info("removeObject was called"); 
        if (this.backend[source]) {
            return await this.backend[source].removeObject(this, objectID);
        } 
    }
 
}

module.exports = BackendSelector;