var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

class DBAdapter {
    // this.adapter contains object with methods implemented for specyfic backend

    constructor(configFile) {
        let adapterType = undefined;
        this.adapter = undefined;
        if (configFile.type === "mongodb") {
            adapterType = require("./mongodb/adapter");
            this.adapter = new adapterType(configFile);
        }

        logger.info("DBAdapter ready");
    }

    // QUERY SECTION
    async loadCoreQueryDataFromDB(database, type, page = 1, query = undefined, inferred = false) {
        if (this.adapter) {
            await this.adapter.loadCoreQueryDataFromDB(database, type, page, query , inferred );
        }

    }

    async loadChildObjectsByUris(database, sub, filter) {
        if (this.adapter) {
            await this.adapter.loadChildObjectsByUris(database, sub, filter);
        }

    }

}

module.exports = DBAdapter;