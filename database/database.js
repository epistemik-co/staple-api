
const dataset_tree = require("graphy").util.dataset.tree;
const factory = require("@graphy/core.data.factory");
const databaseUtilities = require("./database utilities/dataManagementUtilities/dataManagementUtilities");
const dataRetrievalAlgorithm = require("./database utilities/dataManagementUtilities/dataRetrievalAlgorithm");
const flatJsonGenerator = require("./database utilities/flatJsonGenerator/flatjsonGenerator");
var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const DBAdapter = require("./database utilities/adapter/DBAdapter");

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class Database {
    constructor(schemaMapping, configLocation) {
        this.selectAdapter(configLocation);
        this.updateSchemaMapping(schemaMapping);

        this.schemaMapping = schemaMapping;

        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";

        // do we really need this ? 
        this.pages = [];
        this.flatJsons = [];
        this.dbCallCounter = 0;

        logger.log("info", "Database is ready to use");
    }

    selectAdapter(configLocation){
        if(configLocation === undefined){
            logger.info("No database selected");
        }
        else{
            let dbConfig = require(appRoot+configLocation);
            this.adapter = new DBAdapter(dbConfig);
        }
    }

    updateSchemaMapping(schemaMapping){
        databaseUtilities.createReverseContext(schemaMapping);
        databaseUtilities.createGraphMap(schemaMapping);
    }

    // Core Querys using adapter ----------------------------------------------------------------------------------------------------------------------

    async loadChildObjectsFromDBForUnion(sub, filter) {
        logger.info("loadChildObjectsFromDBForUnion was called");
        logger.debug(`with arguments : sub: ${sub}  query: ${filter} `);

        this.dbCallCounter = this.dbCallCounter + 1;
        await this.adapter.loadChildObjectsByUris(this, sub, filter); 
    }

    async loadCoreQueryDataFromDB(type, page = 1, query = undefined, inferred = false) {
        logger.info("loadCoreQueryDataFromDB was called");
        logger.debug(`with arguments : type: ${type} page: ${page} query: ${query} inferred: ${inferred} `);

        this.dbCallCounter = this.dbCallCounter + 1;
        await this.adapter.loadCoreQueryDataFromDB(this, type, page, query, inferred); 
    }

    preparefilters(selection, tree, parentName) {
        logger.info("preparefilters was called");
        return this.adapter.preparefilters(this, selection, tree, parentName); 
        
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
    getObjectsValueArray(sub, pred, expectLiterals = false) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            if (expectLiterals) {
                data.push(x.value.object);
            }
            else {
                data.push(x.value.object.value);
            }
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

    // returns single object value - uri or data
    getSingleStringValue(sub, pred) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        var itr = temp.quads();
        var x = itr.next();
        return x.value.object.value;
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

    async loadQueryData(queryInfo, uri, page, inferred, tree) {
        return dataRetrievalAlgorithm.loadQueryData(this, queryInfo, uri, page, inferred, tree);
    }

    async searchForDataRecursively(selectionSet, uri, tree, reverse = false, parentName = undefined) {
        return dataRetrievalAlgorithm.searchForDataRecursively(this, selectionSet, uri, tree, reverse, parentName);
    }

}

module.exports = Database;