
const dataset_tree = require("graphy").util.dataset.tree;
const factory = require("@graphy/core.data.factory");
const databaseUtilities = require("./database utilities/dataManagementUtilities/dataManagementUtilities");
const dataRetrievalAlgorithm = require("./database utilities/dataManagementUtilities/dataRetrievalAlgorithm");
const flatJsonGenerator = require("./database utilities/flatJsonGenerator/flatjsonGenerator");
const appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
// const util = require("util");
const BackendSelector = require("./database utilities/adapter/BackendSelector");

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class Database {
    constructor(schemaMapping, configObject) {
        this.updateSchemaMapping(schemaMapping);
        this.schemaMapping = schemaMapping;

        this.selectAdapter(configObject);

        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";

        this.flatJsons = [];
        this.dbCallCounter = 0;

        logger.log("info", "Database is ready to use");
    }

    selectAdapter(configObject) {
        this.adapter = new BackendSelector(this.schemaMapping, configObject);
    }

    updateSchemaMapping(schemaMapping) {
        databaseUtilities.createReverseContext(schemaMapping);
        databaseUtilities.createGraphMap(schemaMapping);
    }

    // Core Querys using adapter ----------------------------------------------------------------------------------------------------------------------
    async loadChildObjectsByUris(sub, selection, tree, parentName) {
        logger.info("loadChildObjectsByUris was called");
        logger.debug(`with arguments : sub: ${sub}  ... `);

        this.dbCallCounter = this.dbCallCounter + 1;
        if (this.adapter) {
            await this.adapter.loadChildObjectsByUris(this, sub, selection, tree, parentName);
        }
    }

    async loadCoreQueryDataFromDB(type, page = 1, selectionSet = undefined, inferred = false, tree = undefined) {
        logger.info("loadCoreQueryDataFromDB was called");
        logger.debug(`with arguments : type: ${type} page: ${page} selectionSet: ${selectionSet} inferred: ${inferred} `);

        this.dbCallCounter = this.dbCallCounter + 1;
        if (this.adapter) {
            await this.adapter.loadCoreQueryDataFromDB(this, type, page, selectionSet, inferred, tree);
        }

    }

    async loadObjectsByUris(sub) {
        logger.info("loadObjectsByUris was called");
        logger.debug(`with arguments : sub: ${sub}`);

        if (this.adapter) {
            await this.adapter.loadObjectsByUris(this, sub);
        }
    }

    async pushObjectToBackend(Id) {
        logger.info("pushObjectToBackend was called");
        logger.debug(`with arguments : Id: ${Id}`);
        let flatJson = await this.getFlatJson();
        console.log(this.getAllQuads());
        // console.log((util.inspect(await flatJson , false, null, true)));
        if (this.adapter) {
            await this.adapter.pushObjectToBackend(this, Id, flatJson);
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

    // Array of uri
    isTripleInDB(sub, pred, obj, gra = null) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object" && obj !== undefined) {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);


        let quad = factory.quad(sub, pred, obj, gra);
        return this.database.has(quad);
    }

    // Array of Quads
    getTriplesBySubject(sub) {
        sub = factory.namedNode(sub);

        const temp = this.database.match(sub, null, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
            x = itr.next();
        }
        return data;
    }

    // Array of Quads
    getTriplesByObjectUri(uri) {
        uri = factory.namedNode(uri);

        const temp = this.database.match(null, null, uri);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
            x = itr.next();
        }
        return data;
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

        return x.value.object.value;
    }

    // returns array of uri - Core Query
    async getSubjectsByType(type, predicate, inferred = false) {
        type = factory.namedNode(type);

        if (inferred) {
            predicate = factory.namedNode(this.stampleDataType);
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
        this.database.clear();
    }

    countObjects() {
        let type = "http://schema.org/Thing";
        let predicate = this.stampleDataType;

        type = factory.namedNode(type);
        predicate = factory.namedNode(predicate);


        const temp = this.database.match(null, predicate, type);
        let counter = 0;
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            counter = counter + 1;
            x = itr.next();
        }
        return counter;
    }

    // binding database ----------------------------------------------------------------------------------------------

    async getFlatJson() {
        return await flatJsonGenerator.getFlatJson(this);
    }

    updateInference() {
        databaseUtilities.updateInference(this);
    }

    async insertRDF(rdf, ID, tryToFix = false, uuid = undefined) {
        await databaseUtilities.insertRDFPromise(this.database, rdf, this.schemaMapping, tryToFix, uuid);
        this.updateInference();
    }

    async removeRDF(rdf, ID) {
        await databaseUtilities.removeRDFPromise(this.database, ID, rdf);
        this.updateInference();
    }

    // Query data Retrieval Algorithm ---------------------------------------------------------------------------
    // return 10 ids of the core objects
    async loadQueryData(queryInfo, uri, page, inferred, tree, filter) {
        return dataRetrievalAlgorithm.loadQueryData(this, queryInfo, uri, page, inferred, tree, filter);
    }

}

module.exports = Database;