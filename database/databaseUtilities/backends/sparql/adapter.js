const SparqlClient = require("sparqldb").SparqlClient;
const logger = require("../../../../config/winston");

/* eslint-disable require-atomic-updates */
const jsonld = require("jsonld");
const util = require("util");

class SparqlAdapter {
    constructor(configFile) {
        this.configFile = configFile;
    }

    async loadCoreQueryDataFromDB(database, type, page = 1, selectionSet = undefined, inferred = false, tree = undefined) {

    }

    async loadChildObjectsByUris(database, sub, selection, tree, parentName) {

    }

    async pushObjectToBackend(database, input) {

    }

    async removeObject(database, objectIDs) {

    }

    preparefilters(database, selection, tree) {

    }
}

module.exports = SparqlAdapter;