const read_graphy = require('graphy').content.nt.read;
const dataset_tree = require('graphy').util.dataset.tree
const factory = require('@graphy/core.data.factory');
const MongoClient = require('mongodb').MongoClient;
const jsonld = require('jsonld');

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class Database {
    constructor(schemaMapping) {
        this.schemaMapping = schemaMapping;
        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";
        this.pages = [];
        // this.insertFakeDataToDB = false;
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
        // if(this.insertFakeDataToDB === false){
        //     this.insertFakeDataToDB = true;
        //     this.mongodbAdd();
        // }
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

    findContextName(uri) {
        for (let key in this.schemaMapping["@context"]) {
            if (this.schemaMapping["@context"][key] === uri) {
                return key;
            }
        }
        return uri;
    }

    // Array of uri
    async getObjectsValueArray(sub, pred, expectLiterals = false) {
        // console.log("getObjectsValueArray looking for :")
        // console.log(sub)
        // console.log(pred)

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
        // console.log("Found:")
        // console.log(data)
        // console.log(" ")
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

    // returns array of uri
    async getSubjectsByType(type, predicate, inferred = false, page = undefined, query = undefined) {


        console.log("Before")
        console.log(this.database.size)
        console.log(`Asking for type ${type} page ${page}`)
        await this.loadCoreQueryDataFromDB(type, page, query, inferred)
        console.log("After")
        console.log(this.database.size)
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

    insertRDFPromise(tree, ID, rdf) {
        return new Promise((resolve, reject) => {
            let data = (y_quad) => {
                if (y_quad.subject.value === ID || ID === undefined) {
                    y_quad.graph = factory.namedNode(null);

                    // add inverses 
                    console.log("SZUKAM ID ")
                    console.log(y_quad.object.value)
                    let inverse = this.schemaMapping['@graph'].filter(x => x["@id"] === y_quad.predicate.value)
                    if(ID === "http://staple-api.org/data/2d747982728e3641c1a24aed9eec7e330b2db2"){
                        console.log("inverse")    
                        console.log(inverse)
                    }
                    inverse = inverse[0]
                    if (inverse !== undefined) {
                        inverse['http://schema.org/inverseOf'].forEach(inversePredicate => {
                            let quad = factory.quad(y_quad.object, factory.namedNode(inversePredicate), y_quad.subject, y_quad.graph);
                            tree.add(quad);
                        })
                    }

                    tree.add(y_quad);
                }
            }

            let eof = (h_prefixes) => {
                resolve('done')
            }

            read_graphy(rdf, { data, eof, })
        });
    }

    async insertRDF(rdf, ID) {
        await this.insertRDFPromise(this.database, ID, rdf);
        this.updateInference();
    }

    removeRDFPromise(tree, ID, rdf) {
        return new Promise((resolve, reject) => {
            let data = (y_quad) => {
                if (y_quad.subject.value === ID) {
                    y_quad.graph = factory.namedNode(null);
                    tree.delete(y_quad);
                }
            }

            let eof = (h_prefixes) => {
                resolve('done')
            }

            read_graphy(rdf, { data, eof, })
        });
    }

    async removeRDF(rdf, ID) {
        await this.removeRDFPromise(this.database, ID, rdf);
        this.updateInference();
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
        let addedQuads = []

        while (!itrData.done) {

            if (itrData.value.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                let data = this.schemaMapping["@graph"].filter((x) => { return x['@id'] === itrData.value.object.value })
                for (let key in data) {
                    let uris = data[key]["http://www.w3.org/2000/01/rdf-schema#subClassOf"];
                    for (let x in uris) {
                        this.create(itrData.value.subject.value, this.stampleDataType, uris[x]['@id'])
                        addedQuads.push(`${itrData.value.subject.value}, ${this.stampleDataType}, ${uris[x]['@id']}`)
                    }

                }
            }
            itrData = itr.next();
        }

    }

    // Based on reverse property
    async loadChildObjectsFromDB(sub, pred, type) {
        let url = 'mongodb://127.0.0.1:27017';
        const client = await MongoClient.connect(url, { useNewUrlParser: true })
            .catch(err => { console.log(err); });

        if (!client) {
            return;
        }

        try {
            console.log("START CONNECTION")
            const db = client.db("staple");
            let collection = db.collection('quadsTEST');
            let query = { _type: 'Thing' }

            if (type != undefined) {
                query = { _type: type }
            }

            for (let key in this.schemaMapping['@context']) {
                if (this.schemaMapping['@context'][key] === pred) {
                    query['_reverse'] = {};
                    query['_reverse'][key] = [{ '_id': sub }]
                    break;
                }
            }


            console.log(`finall query['_reverse']: `)
            console.log(query['_reverse'])

            let result = await collection.find(query).toArray();

            result = result.map(x => {
                x['@context'] = this.schemaMapping['@context'];
                return x;
            })

            const rdf = await jsonld.toRDF(result, { format: 'application/n-quads' });
            for (let obj in result) {
                await this.insertRDF(rdf, result[obj]['_id']);
            }
        } catch (err) {
            console.log(err);
        } finally {
            client.close();
        }
    }

    async loadCoreQueryDataFromDB(type, page = 1, query = undefined, inferred = false) {
        let url = 'mongodb://127.0.0.1:27017';
        const client = await MongoClient.connect(url, { useNewUrlParser: true })
            .catch(err => { console.log(err); });

        if (!client) {
            return;
        }

        try {
            const db = client.db("staple");
            let collection = db.collection('quadsTEST');
            let _type = undefined;

            if (query === undefined) {
                for (let key in this.schemaMapping['@context']) {
                    if (this.schemaMapping['@context'][key] === type) {
                        _type = key;
                        break;
                    }
                }
            }

            if (_type !== undefined) {
                if (inferred) {
                    query = { _inferred: _type }
                }
                else {
                    query = { _type: _type }
                }
            }

            let result;
            if (page === undefined) {
                result = await collection.find(query).toArray();
            }
            else {
                result = await collection.find(query).skip(page * 10 - 10).limit(10).toArray();
            }

            // save page conetnt
            this.pages[page] = result.map(x => x['_id'])

            result = result.map(x => {
                x['@context'] = this.schemaMapping['@context'];
                return x;
            })

            const rdf = await jsonld.toRDF(result, { format: 'application/n-quads' });
            for (let obj in result) {
                await this.insertRDF(rdf, result[obj]['_id']);
            }
        } catch (err) {
            console.log(err);
        } finally {
            client.close();
        }

    }

    mongodbAddOrUpdate(flatJson) {
        MongoClient.connect('mongodb://127.0.0.1:27017', async function (err, db) {
            if (err) {
                throw err;
            } else {
                var dbo = db.db("staple");
                let collection = dbo.collection('quadsTEST');

                let result = await collection.find({ "_id": flatJson['_id'] }).toArray();

                if (result[0] !== undefined) {
                    collection.update({ _id: flatJson['_id'] }, flatJson);
                }
                else {
                    dbo.collection("quadsTEST").insertOne(flatJson, function (err, res) {
                        if (err) throw err;
                        console.log("quad inserted");
                    });
                }
                db.close();
            }
        })
    }

    async getFlatJson() {
        // find all objects
        let ids = await this.getSubjectsByType("http://schema.org/Thing", this.stampleDataType);

        // CHECK IF OBJECT ALREADY IN DATABASE IF SO, THEN UPDATE

        for (let i in ids) {
            let id = ids[i]
            let allRelatedQuads = []

            var temp = this.database.match(factory.namedNode(id), null, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                allRelatedQuads.push(x.value);
                x = itr.next();
            }

            temp = this.database.match(null, null, factory.namedNode(id));
            itr = temp.quads();
            x = itr.next();
            while (!x.done) {
                allRelatedQuads.push(x.value);
                x = itr.next();
            }

            // console.log(allRelatedQuads)
            //create json
            let newJson = {
                "_id": id,
                "_type": undefined,
                "_inferred": [],
                "_reverse": {},
            }

            for (let quad in allRelatedQuads) {
                quad = allRelatedQuads[quad]
                // console.log(quad)
                if (quad.subject.value === id) {
                    if (quad.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                        let contextKey = this.findContextName(quad.object.value)
                        newJson["_type"] = contextKey;
                    }
                    else if (quad.object.datatype !== undefined) { //Literal
                        //find key 
                        let fieldKey = quad.predicate.value;
                        if (quad.predicate.value === this.schemaMapping["@context"][quad.predicate.value.split("http://schema.org/")[1]]) {
                            fieldKey = quad.predicate.value.split("http://schema.org/")[1];
                        }
                        else {
                            fieldKey = this.findContextName(quad.predicate.value);
                        }
                        if (newJson[fieldKey] === undefined) {
                            newJson[fieldKey] = []
                        }

                        newJson[fieldKey].push({
                            _value: quad.object.value,
                            _type: this.findContextName(quad.object.datatype.value),
                        });
                    }
                    else if (quad.predicate.value === "http://staple-api.org/datamodel/type") { // _inferred
                        let contextKey = this.findContextName(quad.object.value);
                        newJson['_inferred'].push(contextKey)
                    }
                    else { // object
                        let contextKey = this.findContextName(quad.predicate.value);

                        if (newJson[contextKey] === undefined) {
                            newJson[contextKey] = []
                        }

                        newJson[contextKey].push({ _id: quad.object.value });
                    }
                }

                if (quad.object.value === id) { // _reverse
                    let contextKey = this.findContextName(quad.predicate.value);

                    if (newJson['_reverse'][contextKey] === undefined) {
                        newJson['_reverse'][contextKey] = []
                    }

                    newJson['_reverse'][contextKey].push({ _id: quad.subject.value })
                }
            }
            //add to mongo db
            this.mongodbAddOrUpdate(newJson)
        }
        return "DONE"
    }
}

module.exports = Database