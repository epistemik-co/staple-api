
const dataset_tree = require('graphy').util.dataset.tree
const factory = require('@graphy/core.data.factory');
const MongoClient = require('mongodb').MongoClient;
const jsonld = require('jsonld');
const databaseUtilities = require('./databaseUtilities')
const mongodbUtilities = require('./mongodb/Utilities');
const util = require('util')
var appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/winston`);

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class Database {
    constructor(schemaMapping) {
        databaseUtilities.createReverseContext(schemaMapping)
        databaseUtilities.createGraphMap(schemaMapping)
        this.schemaMapping = schemaMapping;

        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";
        this.pages = [];
        this.flatJsons = [];
        this.dbCallCounter = 0;

        logger.log('info', "Database is ready to use");
    }

    // ---
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

    // ---  
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
            let quad = factory.quad(sub, pred, obj, gra)
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

        return data
    };

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
    };

    // Array of uri
    isTripleInDB(sub, pred, obj, gra = null) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object" && obj !== undefined) {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);


        let quad = factory.quad(sub, pred, obj, gra);
        return this.database.has(quad)
    };

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
    };

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
    };

    // returns single object value - uri or data
    getSingleStringValue(sub, pred) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        var itr = temp.quads();
        var x = itr.next();
        return x.value.object.value;
    };

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
    };

    // returns array of uri - Core Query
    async getSubjectsByType(type, predicate, inferred = false, page = undefined, query = undefined) {
        // await this.loadCoreQueryDataFromDB(type, page, query, inferred);

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
    };

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
    };

    drop() {
        this.database.clear();
    }

    updateInference() {
        // remove all staple : datatype but not Thing 
        let temp = this.database.match(null, null, null);
        let itr = temp.quads();
        let itrData = itr.next();
        while (!itrData.done) {
            if (itrData.value.predicate.value === this.stampleDataType && itrData.value.object.value !== this.schemaMapping["@context"]['Thing']) {
                this.database.delete(itrData.value);
            }
            itrData = itr.next();
        }

        // get all quads and foreach type put inferences .... store in array types already putted to db
        temp = this.database.match(null, null, null);
        itr = temp.quads();
        itrData = itr.next();

        while (!itrData.done) {
            if (itrData.value.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                // let data = this.schemaMapping["@graph"].filter((x) => { return x['@id'] === itrData.value.object.value })
                let data = this.schemaMapping['@graphMap'][itrData.value.object.value];
                if (data !== undefined) {
                    let uris = data["http://www.w3.org/2000/01/rdf-schema#subClassOf"];
                    for (let x in uris) {
                        this.create(itrData.value.subject.value, this.stampleDataType, uris[x]['@id'])
                    }
                }

            }
            itrData = itr.next();
        }
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

    async getFlatJson() {
        return await databaseUtilities.getFlatJson(this);
    }


    async loadChildObjectsFromDBForUnion(sub, filter) {
        logger.info(`loadChildObjectsFromDBForUnion was called`)
        logger.debug(`with arguments : sub: ${sub}  query: ${filter} `)

        this.dbCallCounter = this.dbCallCounter + 1;
        await mongodbUtilities.loadChildObjectsByUris(this, sub, filter);
    }

    async loadCoreQueryDataFromDB(type, page = 1, query = undefined, inferred = false) {
        logger.info(`loadCoreQueryDataFromDB was called`)
        logger.debug(`with arguments : type: ${type} page: ${page} query: ${query} inferred: ${inferred} `)

        this.dbCallCounter = this.dbCallCounter + 1;
        await mongodbUtilities.loadCoreQueryDataFromDB(this, type, page, query, inferred);
    }

    async mongodbAddOrUpdate() {
        mongodbUtilities.mongodbAddOrUpdate(this.flatJsons);
        this.flatJsons = [];
    }

    async insertRDF(rdf, ID, tryToFix = false, uuid = undefined) {
        if (ID !== undefined && ID[0] === undefined) {
            ID = [];
        }
        await databaseUtilities.insertRDFPromise(this.database, ID, rdf, this.schemaMapping, tryToFix, uuid);
        this.updateInference();
    }

    async removeRDF(rdf, ID) {
        await databaseUtilities.removeRDFPromise(this.database, ID, rdf);
        this.updateInference();
    }

    async loadQueryData(queryInfo, uri, page, inferred, tree, query = undefined) {
        this.dbCallCounter = 0; // debug only
        this.drop(); // clear db before new query.

        let coreIds = []
        let resolverName = this.schemaMapping["@revContext"][uri];
        if (resolverName === undefined) {
            return;
        }
        //step 1 
        let variables = queryInfo['variableDefinitions'];
        //step 2 find core object
        let coreSelectionSet = queryInfo['selectionSet'];


        for (let coreSelection in coreSelectionSet['selections']) {
            let filters = this.preparefilters(coreSelectionSet['selections'][coreSelection], tree)
            if (coreSelectionSet["selections"][0].name.value === "_OBJECT") {
                await this.loadCoreQueryDataFromDB(uri, page, filters, inferred);
                coreIds = await this.getSubjectsByType(uri, this.stampleDataType, inferred, page);
            }
            else if (resolverName == coreSelectionSet['selections'][coreSelection].name.value) {
                await this.loadCoreQueryDataFromDB(uri, page, filters, inferred);
                coreIds = await this.getSubjectsByType(uri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", inferred, page);
                await this.searchForDataRecursively(coreSelectionSet['selections'][coreSelection]['selectionSet'], coreIds, tree, false, resolverName);
            }
        }

        return coreIds;
    }

    async searchForDataRecursively(selectionSet, uri, tree, reverse = false, parentName = undefined) {

        logger.info(`searchForDataRecursively was called`)
        logger.debug(`Started function searchForDataRecursively with args:
        \tselectionSet: ${selectionSet}
        \turi: ${util.inspect(uri, false, null, true /* enable colors */)}
        \ttree: ${tree}
        \treverse: ${reverse}
        \tQUADS : ${this.database.size}
        \tObjects : ${this.countObjects()}
        `);

        let name = undefined;
        for (let selection of selectionSet['selections']) {


            if (selection.kind === "InlineFragment") {
                await this.searchForDataRecursively(selection['selectionSet'], uri, tree, false, parentName);
            }
            else if (selection['selectionSet'] !== undefined && selection.name !== undefined) {

                logger.debug("Looking for:")
                logger.debug(selection.kind)
                logger.debug(util.inspect(selection.name, false, null, true))

                name = selection.name.value;
                let newUris = [];
                let type = this.schemaMapping["@context"][name];

                if (type === "@reverse") {
                    await this.searchForDataRecursively(selection['selectionSet'], uri, tree, true, parentName);
                }
                else {
                    for (let id of uri) {
                        let data = [];
                        if (reverse) {
                            data = await this.getSubjectsValueArray(type, id);
                        }
                        else {

                            data = await this.getObjectsValueArray(id, type);
                            logger.debug(`Asked for ID TYPE`)
                            logger.debug(util.inspect(id, false, null, true))
                            logger.debug(util.inspect(type, false, null, true))
                        }

                        for (let x of data) {
                            var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                            if (pattern.test(x)) {
                                newUris.push(x);
                            }
                        }
                    }

                    newUris = [...new Set(newUris)];

                    if (newUris.length > 0) {
                        let filters = this.preparefilters(selection, tree, parentName);
                        await this.loadChildObjectsFromDBForUnion(newUris, filters);

                        let newParentName = tree[parentName].data[name];
                        if (newParentName === undefined) {
                            newParentName = {};
                        }
                        if (newParentName.kind === "ListType") {
                            newParentName = newParentName.data.name
                        }
                        else {
                            newParentName = newParentName.name
                        }

                        await this.searchForDataRecursively(selection['selectionSet'], newUris, tree, false, newParentName)
                    }

                }
            }
            else {
                logger.debug("Skiped object from query")
                logger.debug(selection.kind)
                logger.debug(util.inspect(selection.name, false, null, true))
            }
        }
    }

    preparefilters(selection, tree, parentName) {
        // console.log(util.inspect(selection,false,null,true)) 
        let query = {};
        let fieldName = selection.name.value;
        let fieldData = tree[fieldName];

        if (fieldData === undefined) {
            fieldData = tree[parentName].data[fieldName];
            if (fieldData === undefined) {
                return {};
            }
            if (fieldData.kind === "ListType") {
                fieldData = tree[fieldData.data.name]
            }
            else {
                fieldData = tree[fieldData.name]
            }
        }




        for (let argument of selection.arguments) {
            if (argument.name.value === "filter") {
                for (let filterField of argument.value.fields) {
                    console.log("OBJECT")
                    console.log(filterField)
                    console.log("\n\n")
                    if (fieldData.data[filterField.name.value] !== undefined) {
                        console.log("ADD TO THE FILTER QUERY")


                        if (filterField.value.kind === "ListValue") {
                            let objectFilterName = filterField.name.value;

                            if (filterField.name.value !== '_id') {
                                objectFilterName = objectFilterName + '._value';
                            }

                            query[objectFilterName] = {}
                            query[objectFilterName]['$in'] = []

                            for (let elem of filterField.value.values) {

                                if (filterField.name.value === '_id') {
                                    query[objectFilterName]['$in'].push(elem.value)
                                }
                                else {
                                    query[objectFilterName]['$in'].push(elem.value)

                                }
                            }
                        }
                        else {
                            if (filterField.name.value === '_id') {
                                query[filterField.name.value] = { '_value': filterField.value.value };
                            }
                            else {

                                query[filterField.name.value] = filterField.value.value;
                            }
                        }

                    }
                    else {
                        console.log("SKIPPPPPP")
                    }
                }
            }
        }
        console.log("FINAL QUERY FILETRS")

        console.log(util.inspect(query, false, null, true))
        // domyslnie taka postac
        // { _id: 'http://data/bluesB4', "legalName": {$in : [{ "_type":"Text", "_value":"Blues Brothers" }]} }

        if(Object.keys(query).length === 0 && query.constructor === Object){
            return undefined;
        }
        return query
    }
}

module.exports = Database