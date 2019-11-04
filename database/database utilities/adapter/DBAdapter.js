var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

class DBAdapter {
    // this.adapter contains object with methods implemented for specyfic backend

    constructor(schemaMapping, configObject) {
        let adapterType = undefined;
        this.adapter = undefined;

        if (configObject === undefined) {
            adapterType = require("../../adapters/memory/adapter");
            this.adapter = new adapterType(schemaMapping);
            return;
        }

        if (configObject.type === "mongodb") {
            adapterType = require("../../adapters/mongodb/adapter");
            this.adapter = new adapterType(configObject);
        }
        // else if(configObject.type === "mysql"){ ... }


        logger.info("DBAdapter ready");
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
    async loadCoreQueryDataFromDB(database, type, page = 1, selectionSet = undefined, inferred = false, tree = undefined) {
        if (this.adapter) {
            await this.adapter.loadCoreQueryDataFromDB(database, type, page, selectionSet, inferred, tree);
        }
    }

    async loadChildObjectsByUris(database, sub, selection, tree, parentName) {
        if (this.adapter) {
            await this.adapter.loadChildObjectsByUris(database, sub, selection, tree, parentName);
        }
    }

    // sub = [ ... ]
    async loadObjectsByUris(database, sub) {
        if (this.adapter) {
            await this.adapter.loadObjectsByUris(database, sub);
        }
    }

    // sub = [ ... ]
    async pushObjectToBackend(database, sub, flatJson) {
        if (this.adapter) {
            await this.adapter.pushObjectToBackend(database, sub, flatJson);
        }
    }
}

module.exports = DBAdapter;