var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

class DBAdapter {
    // this.adapter contains object with methods implemented for specyfic backend

    constructor(configObject) {
        let adapterType = undefined;
        this.adapter = undefined;
        if (configObject.type === "mongodb") {
            adapterType = require("../../adapters/mongodb/adapter");
            this.adapter = new adapterType(configObject);
        }
        // else if(configObject.type === "mysql"){ ... }

        logger.info("DBAdapter ready");
    }

    // QUERY SECTION
    async loadCoreQueryDataFromDB(database, type, page = 1, query = undefined, inferred = false) {
        if (this.adapter) {
            await this.adapter.loadCoreQueryDataFromDB(database, type, page, query, inferred);
        }
    }

    async loadChildObjectsByUris(database, sub, filter) {
        if (this.adapter) {
            await this.adapter.loadChildObjectsByUris(database, sub, filter);
        }
    }

    preparefilters(database, selection, tree, parentName) {
        if (this.adapter) {
            return this.adapter.preparefilters(database, selection, tree, parentName);
        }
    }
}

module.exports = DBAdapter;