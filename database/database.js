
const dataset_tree = require("graphy").util.dataset.tree;
const factory = require("@graphy/core.data.factory");
const databaseUtilities = require("./databaseUtilities/dataManagementUtilities/dataManagementUtilities");
const dataRetrievalAlgorithm = require("./databaseUtilities/dataManagementUtilities/dataRetrievalAlgorithm");
const logger = require("../config/winston");
const BackendSelector = require("./databaseUtilities/adapter/BackendSelector");

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class Database {
    constructor(schemaMapping, configObject) {
        this.updateSchemaMapping(schemaMapping);
        this.schemaMapping = schemaMapping;
        this.selectAdapter(configObject);
        this.defaultSource = configObject.dataSources;
        this.database = dataset_tree();
        this.stapleDataType = "http://staple-api.org/datamodel/type";
        this.flatJsons = [];
        this.dbCallCounter = 0;
        //when no source argument is given in query/mutation use default dataSource
        this.defaultDetasource = configObject.dataSources.default ? configObject.dataSources.default : "memory";

        logger.log("info", "Data sources are ready to use");
    }

    //constructs new BackendSelector object
    selectAdapter(configObject, source = this.defaultDetasource) {
        this.adapter = new BackendSelector(this.schemaMapping, configObject, source);
    }

    updateSchemaMapping(schemaMapping) {
        databaseUtilities.createReverseContext(schemaMapping);
        databaseUtilities.createGraphMap(schemaMapping);
    }

    // Core Queries using adapter ----------------------------------------------------------------------------------------------------------------------
    //TODO: move following methods to new dedicated file

    /**
     * 
     * Loads query-child objects
     * 
     * @param {} sub
     * @param {} selection
     * @param {} tree
     * @param {} parentName
     * @param {string} source
     */

    async loadChildObjectsByUris(sub, selection, tree, parentName, source = this.defaultDetasource) {
        logger.info(`loadChildObjectsByUris was called in database/database with source: ${source}`);
        // logger.debug(`with arguments : sub: ${sub}  ... `);

        this.dbCallCounter = this.dbCallCounter + 1;
        if (this.adapter) {
            await this.adapter.loadChildObjectsByUris(this, sub, selection, tree, parentName, source);
        }
    }

    /**
     * 
     * Loads core query data
     * 
     * @param {} type
     * @param {int} page
     * @param {JSON} selectionSet
     * @param {boolean} inferred
     * @param {JSON} tree
     * @param {string} source
     * @param {JSON} filter 
     */

    async loadCoreQueryDataFromDB(type, page = undefined, selectionSet = undefined, inferred = false, tree = undefined, source = this.defaultDetasource, filter) {
        logger.info("loadCoreQueryDataFromDB was called in database/database");
        logger.debug(`with arguments : type: ${type} page: ${page} selectionSet: ${JSON.stringify(selectionSet)} inferred: ${inferred} `);
        this.dbCallCounter = this.dbCallCounter + 1;
        if (this.adapter) {
            await this.adapter.loadCoreQueryDataFromDB(this, type, page, selectionSet, inferred, tree, source, filter);
        }

    }

    /**
     * 
     * Loads objects by URIS from cache
     * 
     * @param {} sub
     */

    async loadObjectsByUris(sub) {
        logger.info("loadObjectsByUris was called in database/database");
        // logger.debug(`with arguments : sub: ${sub}`);

        if (this.adapter) {
            await this.adapter.loadObjectsByUris(this, sub);
        }
    }

    /**
     * 
     * PUT
     * 
     * @param {JSON} input
     * @param {} schemaMapping
     * @param {string} source
     * @returns {boolean}
     */

    async pushObjectToBackend(input, schemaMapping, source = this.defaultDetasource) {
        logger.info("pushObjectToBackend was called in database/database");
        // logger.debug(`with arguments : ${input}`);
        if (this.adapter) {
            await this.adapter.pushObjectToBackend(this, input, source);
        }
    }

    /**
     * 
     * Deletes object by uri
     * 
     * @param {string[]} objectID - list of uris to be deleted
     * @param {string} source
     * @returns {boolean}
     */

    async removeObject(objectID, source) {
        logger.info("removeObject was called in database/database");
        if (this.adapter) {
            return await this.adapter.removeObject(this, objectID, source);
        }
    }

    // Memory database operations ---------------------------------------------------------------------------------------------------------
    create(sub, pred, obj, gra = null) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object") {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);

        let quad = factory.quad(sub, pred, obj, gra);
        this.database.add(quad);
        return true;
    }

    delete(sub, pred, obj, gra = null) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object" && obj !== undefined) {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);

        // remove all objects of specyfic type
        if (obj === undefined) {
            const temp = this.database.match(sub, pred, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                this.database.delete(x.value);
                x = itr.next();
            }
        }
        // remove one specyfic object of specyfic type
        else {
            let quad = factory.quad(sub, pred, obj, gra);
            this.database.delete(quad);
        }
    }

    // returns boolean 
    deleteID(id) {
        id = factory.namedNode(id);

        let removed = false;
        var temp = this.database.match(id, null, null);
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            this.database.delete(x.value);
            removed = true;
            x = itr.next();
        }

        temp = this.database.match(null, null, id);
        itr = temp.quads();
        x = itr.next();
        while (!x.done) {
            this.database.delete(x.value);
            removed = true;
            x = itr.next();
        }
        return removed;
    }

    // Array of uri
    getObjectsValueArray(sub, pred) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value.object.value);

            x = itr.next();
        }

        return data;
    }

    // Array of uri
    async getSubjectsValueArray(pred, obj, expectLiterals = false) {
        pred = factory.namedNode(pred);
        obj = factory.namedNode(obj);

        const temp = this.database.match(null, pred, obj);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            if (expectLiterals) {
                await data.push(x.value.subject);
            }
            else {
                await data.push(x.value.subject.value);
            }
            x = itr.next();
        }
        return data;
    }

    // Array of uri
    async getSubjects() {

        const temp = this.database.match(null, null, null);
        var itr = temp.quads();
        var x = itr.next();
        let uris = new Set();
        while (!x.done) {
            uris.add(x.value.subject.value);
            x = itr.next();
        }
        return [...uris];
    }

    // returns single object value - data
    getSingleLiteral(sub, pred) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        var itr = temp.quads();
        var x = itr.next();

        if (x.value === undefined) {
            return null;
        }

        return x.value.object;
    }

    // returns array of uri - Core Query
    async getSubjectsByType(type, predicate, inferred = false) {
        type = factory.namedNode(type);

        if (inferred) {
            predicate = factory.namedNode(this.stapleDataType);
        }
        else {
            predicate = factory.namedNode(predicate);
        }

        const temp = this.database.match(null, predicate, type);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value.subject.value);
            x = itr.next();
        }

        return data;
    }

    // returns all quads
    getAllQuads() {
        const temp = this.database.match(null, null, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
            x = itr.next();
        }
        return data;
    }

    drop() {
        this.database = dataset_tree();
    }

    countObjects() {
        return this.getSubjects().length;
    }

    // binding database ----------------------------------------------------------------------------------------------

    updateInference() {
        databaseUtilities.updateInference(this);
    }

    async insertRDF(rdf) {
        await databaseUtilities.insertRDFPromise(this.database, rdf);
        this.updateInference();
    }

    async removeRDF(rdf, ID) {
        await databaseUtilities.removeRDFPromise(this.database, ID, rdf);
        this.updateInference();
    }

    // Query data Retrieval Algorithm ---------------------------------------------------------------------------
    // return 10 ids of the core objects

    async loadQueryData(queryInfo, uri, page, inferred, tree, source = this.defaultDetasource, filter) {
        if (source === undefined) {
            source = this.defaultDetasource;
        }
        return dataRetrievalAlgorithm.loadQueryData(this, queryInfo, uri, page, inferred, tree, filter, source, source);
    }

}

module.exports = Database;