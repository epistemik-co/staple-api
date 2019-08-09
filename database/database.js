
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
        // const MongoClient = require(‘mongodb’).MongoClient;
        // const uri = "mongodb+srv://Artur:LR04f444qjPAa6Ul@staple-ximll.mongodb.net/test?retryWrites=true&w=majority";
        // this.client = new MongoClient(uri, { useNewUrlParser: true });
        // client.connect(err => {
        // const collection = client.db("test").collection("devices");
        // // perform actions on the collection object
        // client.close();
        // });
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
                data.push(x.value.object);
            }
            else {
                data.push(x.value.object.value);
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

        console.log(data)
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
        await mongodbUtilities.loadChildObjectsFromDB(this, sub, pred, type)
    }


    async loadChildObjectsFromDBForUnion(sub, pred = undefined, type = undefined) {
        await mongodbUtilities.loadChildObjectsFromDBForUnion(this, sub, pred, type)
    }

    async loadCoreQueryDataFromDB(type, page = 1, query = undefined, inferred = false) {
        await mongodbUtilities.loadCoreQueryDataFromDB(this, type, page, query, inferred);
    }

    async mongodbAddOrUpdate() {
        mongodbUtilities.mongodbAddOrUpdate(this.flatJsons);
        this.flatJsons = [];
    }

    async insertRDF(rdf, ID, tryToFix = false) {
        await databaseUtilities.insertRDFPromise(this.database, ID, rdf, this.schemaMapping, tryToFix);
        this.updateInference();
    }

    async removeRDF(rdf, ID) {
        await databaseUtilities.removeRDFPromise(this.database, ID, rdf);
        this.updateInference();
    }

    async loadQueryData(queryInfo, uri, page, inferred, tree) {
        let coreIds = []
        let resolverName = this.schemaMapping["@revContext"][uri];
        if (resolverName === undefined) {
            return;
        }
        //step 1 
        let variables = queryInfo['variableDefinitions'];
        // console.log(variables)
        //step 2 
        // console.log(page)
        //step 3 find core object
        let coreSelectionSet = queryInfo['selectionSet'];
        for (let coreSelection in coreSelectionSet['selections']) {
            if (resolverName == coreSelectionSet['selections'][coreSelection].name.value) {

                await this.loadCoreQueryDataFromDB(uri, page, undefined, inferred);
                coreIds = await this.getSubjectsByType(uri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", inferred, page);
                // console.log(coreIds)

                this.searchForDataRecursively(coreSelectionSet['selections'][coreSelection]['selectionSet'], coreIds, tree, resolverName)

                // let selectionSet = coreSelection['selectionSet']
                // selectionSet['selections'].forEach(async selection => {
                //     if(resolverName == selection.name.value){
                //         this.find

                //     }
                // })
            }
        }

        // for(let selection in selectionSet['selections']){
        //     console.log(selection)
        // }

        return coreIds;

    }

    async searchForDataRecursively(selectionSet, uri, tree, lastName = undefined) { // what if got _reverse ?
        let name = undefined;
        await selectionSet['selections'].forEach(async selection => {
            if (selection['selectionSet'] !== undefined) {
                // object or union
                let isFragment = false;
                if (selection.kind === 'InlineFragment') {
                    isFragment = true;
                }
                if (selection.name !== undefined && selection.kind === "Field") {
                    name = selection.name.value;

                    console.log(name)
                    // find in tree what this field returns...
                    let type = {}
                    if(tree[lastName] !== undefined) {

                        let node = tree[lastName]["data"][name];
                        if(node.kind === "ListType"){
                            node = node.data;
                        }
                        type = this.findTypeInSchemaMappingGraph(node.name);
                    }

                    if (type !== undefined) {
                        
                        if (type['@type'] === "http://www.w3.org/2000/01/rdf-schema#Class" ) {
                            console.log("CLASS NEED DATA\n")
                            // loadChildObjectsFromDB uri + obecna nazwa predykatu do reverse + typ
                            let newUris = []
                            // let pred = 
                            let type = this.schemaMapping["@context"][name];
                            
                            if (type === undefined) {
                                return;
                            }
                            // get all uris
                            for (let id in uri) {
                                let data = await this.getObjectsValueArray(uri[id], type);
                                for (let x in data) {
                                    var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                                    if (!pattern.test(data[x])) {
                                        continue;
                                    }
                                    newUris.push(data[x]);
                                }
                            }

                            await this.loadChildObjectsFromDB(newUris, name, node.name) // need object return type ...
                            uri = newUris; // nw czy to dobrze
                        }
                        else {
                            console.log("NOT CLASS\n")

                            if (selection['selectionSet']['selections'].filter(x => x.kind === "InlineFragment").length > 0) {
                                console.log("UNION BETTER SEARCH FOR URIS")
                                let newUris = []
                                let type = this.schemaMapping["@context"][name];
                                if (type === undefined) {
                                    return;
                                }
                                // get all uris
                                for (let id in uri) {
                                    let data = await this.getObjectsValueArray(uri[id], type);
                                    for (let x in data) {
                                        var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                                        if (!pattern.test(data[x])) {
                                            continue;
                                        }
                                        newUris.push(data[x]);
                                    }
                                }
                                // console.log(newUris)
                                // need to get data for all new uris
                                await this.loadChildObjectsFromDBForUnion(newUris)
                                uri = newUris; // nw czy to dobrze
                            }
                        }
                    }
                }
                else if (isFragment) {
                    name = selection.typeCondition.name.value;
                    // let type = this.schemaMapping["@context"][lastName];
                    // if (type === undefined) {
                    //     return;
                    // }
                    // // dla uri znajdz wszystkie elementy z unii ktore maja id (uri) zbierz do kupy i odpytaj o obiekty
                    // let newUris = []
                    // for(let id in uri){
                    //     let data = await this.getObjectsValueArray(uri[id], type)
                    //     // await data.forEach(async x => await newUris.push(x));
                    //     for(let x in data){
                    //         newUris.push(data[x]);
                    //     }
                    //     // console.log(id)
                    //     // console.log(type)
                    //     // console.log(data)
                    //     // console.log(newUris)
                    // }
                    // // console.log("\nCHCE POBRAC")
                    // // console.log(newUris)
                }


                this.searchForDataRecursively(selection['selectionSet'], uri, name)
            }
        })

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