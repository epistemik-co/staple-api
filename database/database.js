
const dataset_tree = require('graphy').util.dataset.tree
const factory = require('@graphy/core.data.factory');
const MongoClient = require('mongodb').MongoClient;
const jsonld = require('jsonld');
const databaseUtilities = require('./databaseUtilities')
const mongodbUtilities = require('./mongodb/Utilities')

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class Database {
    constructor(schemaMapping) {
        databaseUtilities.createReverseContext(schemaMapping)
        this.schemaMapping = schemaMapping;

        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";
        this.pages = [];
        this.flatJsons = [];
        this.dbCallCounter = 0;
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
    async getObjectsValueArray(sub, pred, expectLiterals = false) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            if (expectLiterals) {
                await data.push(x.value.object);
            }
            else {
                await data.push(x.value.object.value);
            }
            x = itr.next();
        }


        return data;
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
                await data.push(x.value.object);
            }
            else {
                await data.push(x.value.object.value);
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
                let data = this.schemaMapping["@graph"].filter((x) => { return x['@id'] === itrData.value.object.value })
                for (let key in data) {
                    let uris = data[key]["http://www.w3.org/2000/01/rdf-schema#subClassOf"];
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
        console.log(counter)
        return counter;
    }

    async getFlatJson() {
        return await databaseUtilities.getFlatJson(this);
    }

    async loadChildObjectsFromDB(sub, pred, type) {
        console.log('\x1b[36m%s\x1b[0m', `loadChildObjectsFromDB was called with arguments : sub: ${sub}  pred: ${pred}  type: ${type} `)
        this.dbCallCounter = this.dbCallCounter + 1;
        await mongodbUtilities.loadChildObjectsFromDB(this, sub, pred, type)
    }


    async loadChildObjectsFromDBForUnion(sub, pred = undefined, type = undefined) {
        console.log('\x1b[36m%s\x1b[0m', `loadChildObjectsFromDBForUnion was called with arguments : sub: ${sub}  pred: ${pred}  type: ${type} `)
        this.dbCallCounter = this.dbCallCounter + 1;
        await mongodbUtilities.loadChildObjectsFromDBForUnion(this, sub, pred, type)
    }

    async loadCoreQueryDataFromDB(type, page = 1, query = undefined, inferred = false) {
        console.log('\x1b[36m%s\x1b[0m', `loadCoreQueryDataFromDB was called with arguments : type: ${type} page: ${page} query: ${query} inferred: ${inferred} `)
        this.dbCallCounter = this.dbCallCounter + 1;
        await mongodbUtilities.loadCoreQueryDataFromDB(this, type, page, query, inferred);
    }

    async mongodbAddOrUpdate() {
        mongodbUtilities.mongodbAddOrUpdate(this.flatJsons);
        this.flatJsons = [];
    }

    async insertRDF(rdf, ID, tryToFix = false) {
        if (ID[0] === undefined && ID !== undefined) {
            ID = [];
        }
        await databaseUtilities.insertRDFPromise(this.database, ID, rdf, this.schemaMapping, tryToFix);
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
            if (coreSelectionSet["selections"][0].name.value === "_OBJECT") {
                await this.loadCoreQueryDataFromDB(uri, page, {}, inferred);
                coreIds = await this.getSubjectsByType(uri, this.stampleDataType, inferred, page);
            }
            else if (resolverName == coreSelectionSet['selections'][coreSelection].name.value) {
                await this.loadCoreQueryDataFromDB(uri, page, undefined, inferred);
                coreIds = await this.getSubjectsByType(uri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", inferred, page);
                await this.searchForDataRecursively(coreSelectionSet['selections'][coreSelection]['selectionSet'], coreIds, tree, resolverName);
            }
        }

        return coreIds;
    }

    async searchForDataRecursively(selectionSet, uri, tree, lastName = undefined) {
        console.log('\x1b[33m%s\x1b[0m', "\nsearchForDataRecursively")
        console.log(`Started function searchForDataRecursively with args: \nselectionSet: ${selectionSet}\nuri: ${uri}\ntree: ${tree}\nlastName: ${lastName}`)
        console.log(`QUADS : ${this.database.size}`)
        this.countObjects();
        console.log("\n\n")

        let name = undefined;

        for (let selection in selectionSet['selections']) {
            selection = selectionSet['selections'][selection];

            if (selection['selectionSet'] !== undefined && selection.name !== undefined && selection.kind === "Field") {
                // object or union or reverse
                name = selection.name.value;

                // find in tree what this field returns...
                let objectType = {};
                let node = {};
                if (tree[lastName] !== undefined) {
                    node = tree[lastName]["data"][name];
                    if (node.kind === "ListType") {
                        node = node.data;
                    }
                    objectType = this.findTypeInSchemaMappingGraph(node.name);

                    // reverse
                    if (objectType === undefined) {
                        objectType = tree[node.name];
                    }
                }

                if (objectType === undefined) {
                    continue;
                }

                let newUris = []
                let type = this.schemaMapping["@context"][name];
                
                if (objectType['@type'] === "http://www.w3.org/2000/01/rdf-schema#Class" && objectType !== undefined) {
                    // console.log("CLASS NEED DATA\n")
                    
                    for (let id in uri) {
                        let data = await this.getObjectsValueArray(uri[id], type);
                        for (let x in data) {
                            var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                            if (pattern.test(data[x])) {
                                newUris.push(data[x]);
                            }
                        }
                    }
                    
                    
                    await this.loadChildObjectsFromDB(newUris, name, node.name);
                    
                    uri = [...new Set(newUris)];
                    
                    let returnedType = tree[lastName]["data"][name];

                    returnedType = returnedType.kind === "ListType" ? returnedType.data.name : returnedType.name;
                        
                    await this.searchForDataRecursively(selection['selectionSet'], uri, tree, returnedType);
                }
                else {
                    console.log("NOT CLASS\n")
                    
                    if (objectType.type === "UnionType" && objectType !== undefined) {
                        // console.log("UNION BETTER SEARCH FOR URIS")
                        
                        // get all uris
                        for (let id in uri) {
                            let data = await this.getObjectsValueArray(uri[id], type);
                            for (let x in data) {
                                var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                                if (pattern.test(data[x])) {
                                    newUris.push(data[x]);
                                }
                            }
                        }
                        await this.loadChildObjectsFromDBForUnion(newUris)

                        uri = [...new Set(newUris)];

                        await this.searchForDataRecursively(selection['selectionSet'], uri, tree, name)
                    }
                    else if (objectType.type === "Reverse" && objectType !== undefined) {
                        // console.log("Reverse - SEARCH FOR URIS")
                        let revSelectionSet = selection.selectionSet.selections;

                        for (let selection in revSelectionSet) {
                            selection = revSelectionSet[selection] 

                            let name = selection.name.value;
                            let type = this.schemaMapping["@graph"].filter(x => x["@id"] === this.schemaMapping["@context"][name])[0];

                            for (let id in uri) {
                                for (let typeId in type['http://schema.org/inverseOf']) {
                                    let data = await this.getSubjectsValueArray( type['http://schema.org/inverseOf'][typeId], uri[id]);

                                    data = await this.getTriplesBySubject(uri[id]);
                                    
                                    for(let quad in data){
                                        quad = data[quad];

                                        if(quad.predicate.value !== type['http://schema.org/inverseOf'][typeId]){
                                            continue;
                                        }

                                        var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                                        if (pattern.test(quad.object.value)) {
                                            newUris.push(quad.object.value);
                                        }
                                    }
                                }
                            }


                            for (let typeId in type['http://schema.org/inverseOf']) {
                                newUris = [...new Set(newUris)];
                                
                                await this.loadChildObjectsFromDBForUnion(newUris)

                                let expectedType = tree[lastName]['data'][this.schemaMapping['@revContext'][type['http://schema.org/inverseOf'][typeId]]];
               
                                expectedType = expectedType.kind === "ListType" ? expectedType.data.name : expectedType.name;

                                await this.searchForDataRecursively(selection['selectionSet'], newUris, tree, expectedType)
                            }
                        }
                    }
                }
            }
        }
    }

    findTypeInSchemaMappingGraph(name) {

        let uri = this.schemaMapping["@context"][name];
        if (uri === undefined) {
            return undefined;
        }

        let filtered = this.schemaMapping["@graph"].filter(x => x['@id'] === uri)[0]
        return filtered
    }
}

module.exports = Database