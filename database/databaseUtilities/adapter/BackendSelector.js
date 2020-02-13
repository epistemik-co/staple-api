var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

class BackendSelector {
    // this.backend contains object with methods implemented for specyfic backend

    constructor(schemaMapping, configObject) {
        let adapterType = undefined;
        this.backend = undefined;

        if (configObject === undefined) {
            logger.warn("You are using in memory database!")
            adapterType = require("../backends/memory/adapter");
            this.backend = new adapterType(schemaMapping);
            return;
        }

        if (configObject.type === "mongodb") {
            adapterType = require("../backends/mongodb/adapter");
            this.backend = new adapterType(configObject);
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
    async loadCoreQueryDataFromDB(database, type, page = undefined, selectionSet = undefined, inferred = false, tree = undefined) {
        if (this.backend) {
            await this.backend.loadCoreQueryDataFromDB(database, type, page, selectionSet, inferred, tree);
        }
    }

    async loadChildObjectsByUris(database, sub, selection, tree, parentName) {
        if (this.backend) {
            await this.backend.loadChildObjectsByUris(database, sub, selection, tree, parentName);
        }
    }

    // sub = [ ... ]
    async loadObjectsByUris(database, sub) {
        if (this.backend) {
            await this.backend.loadObjectsByUris(database, sub);
        }
    }

    // sub = [ ... ]
    async pushObjectToBackend(database, input) { 
        if (this.backend) {
            await this.backend.pushObjectToBackend(database, input);
        }
    }

    async removeObject(database, objectID){
        logger.info("removeObject was called"); 
        if (this.backend) {
            return await this.backend.removeObject(this, objectID);
        } 
    }
 
}

module.exports = BackendSelector;