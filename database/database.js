const read_graphy = require('graphy').content.nt.read;
const dataset_tree = require('graphy').util.dataset.tree
const factory = require('@graphy/core.data.factory');
const graphy_write = require('@graphy/content.nq.write');
// const schemaMapping = require('../schema/schema-mapping');
const MongoClient = require('mongodb').MongoClient;
const format = require('util').format;
const jsonld = require('jsonld');

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class Database {
    constructor(schemaMapping) {
        this.schemaMapping = schemaMapping;
        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";
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

        this.mongodbAdd(quad);
        // this.database.add(quad);
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
    async getSubjectsByType(type, predicate, inferred = false) {
        let url = 'mongodb://127.0.0.1:27017';
        const client = await MongoClient.connect(url, { useNewUrlParser: true })
            .catch(err => { console.log(err); });

        if (!client) {
            return;
        }

        try {

            const db = client.db("staple");

            let collection = db.collection('quads');

            let query = { _type: 'Organization' }

            let result = await collection.findOne(query);

            result["@context"] = {
                "_id": "@id",
                "_value": "@value",
                "_type": "@type",
                "_reverse": "@reverse",
                "Thing": "http://schema.org/Thing",
                "Organization": "http://schema.org/Organization",
                "Person": "http://schema.org/Person",
                "Patient": "http://schema.org/Patient",
                "Text": "http://schema.org/Text",
                "Number": "http://schema.org/Number",
                "Integer": "http://schema.org/Integer",
                "legalName": "http://schema.org/legalName",
                "hasShareholder": "http://schema.org/hasShareholder",
                "shareholderOf": "http://schema.org/shareholderOf",
                "employee": "http://schema.org/employee",
                "affiliation": "http://schema.org/affiliation",
                "noOfEmployees": "http://schema.org/noOfEmployees",
                "name": "http://schema.org/name"
            }


            const rdf = await jsonld.toRDF(result, { format: 'application/n-quads' });
            // console.log(rdf)
            await this.insertRDF(rdf, result['_id']);
            console.log(this.getAllQuads());

        } catch (err) {

            console.log(err);
        } finally {

            client.close();
        }

        // MongoClient.connect('mongodb://127.0.0.1:27017', { useNewUrlParser: true }, async function (err, db) {
        //     if (err) {
        //         throw err;
        //     } else {
        //         var dbo = db.db("staple");
        //         console.log(await dbo.collection("quads").find({ _type: 'Organization' }).toArray())
        //         await dbo.collection("quads").find({ _type: 'Organization' }).toArray(async function (err, result) {
        //             if (err) throw err;
        //             result = result.map(x => {
        //                 return {
        //                     ...x,
        //                     ["@context"]: {
        //                         "_id": "@id",
        //                         "_value": "@value",
        //                         "_type": "@type",
        //                         "_reverse": "@reverse",
        //                         "Thing": "http://schema.org/Thing",
        //                         "Organization": "http://schema.org/Organization",
        //                         "Person": "http://schema.org/Person",
        //                         "Patient": "http://schema.org/Patient",
        //                         "Text": "http://schema.org/Text",
        //                         "Number": "http://schema.org/Number",
        //                         "Integer": "http://schema.org/Integer",
        //                         "legalName": "http://schema.org/legalName",
        //                         "hasShareholder": "http://schema.org/hasShareholder",
        //                         "shareholderOf": "http://schema.org/shareholderOf",
        //                         "employee": "http://schema.org/employee",
        //                         "affiliation": "http://schema.org/affiliation",
        //                         "noOfEmployees": "http://schema.org/noOfEmployees",
        //                         "name": "http://schema.org/name"
        //                     }
        //                 }
        //             })

        //             const rdf = await jsonld.toRDF(result[0], { format: 'application/n-quads' });
        //             // console.log(rdf)
        //             // this.insertRDF(rdf);

        //         });
        //         db.close();
        //     }
        // })

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
                if (y_quad.subject.value === ID) {
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

    mongodbAdd(quad) {
        MongoClient.connect('mongodb://127.0.0.1:27017', async function (err, db) {
            if (err) {
                throw err;
            } else {
                var dbo = db.db("staple");
                var myobj = quad
                // dbo.collection("quads").insertOne(myobj, function(err, res) {
                //     if (err) throw err;
                //     console.log("quad inserted");
                //     db.close();
                // });
                db.close();
            }
        })
    }

    mongodbMatch() {

    }

    mongodbRemove() {

    }
}

module.exports = Database