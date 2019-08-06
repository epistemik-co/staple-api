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
            if(expectLiterals){
                data.push(x.value.object);
            }
            else{
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

        //await this.loadCoreQueryDataFromDB(type, page, query, inferred)
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
                    let inverse = this.schemaMapping['@graph'].filter(x => x["@id"] === y_quad.predicate.value)
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
            const db = client.db("staple");
            let collection = db.collection('quads');
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
            let collection = db.collection('quads');
            let _type = undefined;

            if (query === undefined) {
                for (let key in this.schemaMapping['@context']) {
                    if (this.schemaMapping['@context'][key] === type) {
                        _type = key;
                        break;
                    }
                }
            }

            if(_type !== undefined){
                if(inferred){
                    query = { _inferred: _type }
                }
                else{
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

    mongodbAdd() {
        MongoClient.connect('mongodb://127.0.0.1:27017', async function (err, db) {
            if (err) {
                throw err;
            } else {
                var dbo = db.db("staple");
                for (let i = 8; i < 1000; i++) {
                    var myobj = [{
                        "_id": "http://data/bluesB" + i,
                        "_type": "Organization",
                        "_inferred": [
                            "Organization",
                            "Thing"
                        ],
                        "employee": [
                            {
                                "_id": "http://data/elwoodB" + i
                            },
                            {
                                "_id": "http://data/jakeB" + i
                            }
                        ],
                        "legalName": {
                            "_type": "Text",
                            "_value": "Blues Brothers"
                        },
                        "noOfEmployees": {
                            "_type": "Integer",
                            "_value": "2"
                        },
                        "_reverse": {
                            "affiliation": [
                                {
                                    "_id": "http://data/elwoodB" + i
                                },
                                {
                                    "_id": "http://data/jakeB" + i
                                }
                            ]
                        }
                    },

                    {
                        "_id": "http://data/elwoodB" + i,
                        "_type": "Person",
                        "_inferred": [
                            "Person",
                            "Thing"
                        ],
                        "name": {
                            "_type": "Text",
                            "_value": "Blues"
                        },
                        "_reverse": {
                            "employee": [
                                {
                                    "_id": "http://data/bluesB" + i
                                }
                            ]
                        },
                        "affiliation": [
                            {
                                "_id": "http://data/bluesB" + i
                            }
                        ]
                    },

                    {
                        "_id": "http://data/jakeB" + i,
                        "_type": "Person",
                        "_inferred": [
                            "Person",
                            "Thing"
                        ],
                        "name": {
                            "_type": "Text",
                            "_value": "Brothers"
                        },
                        "_reverse": {
                            "employee": [
                                {
                                    "_id": "http://data/bluesB" + i
                                }
                            ]
                        },
                        "affiliation": [
                            {
                                "_id": "http://data/bluesB" + i
                            }
                        ]
                    }
                    ]
                    dbo.collection("quads").insertMany(myobj, function (err, res) {
                        if (err) throw err;
                        console.log("quad inserted");

                    });
                }
                db.close();

            }
        })
    }
}

module.exports = Database