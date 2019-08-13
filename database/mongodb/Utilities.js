const MongoClient = require('mongodb').MongoClient;
const jsonld = require('jsonld');
const util = require('util')

const url = "mongodb+srv://Artur:LR04f444qjPAa6Ul@staple-ximll.mongodb.net/test?retryWrites=true&w=majority"; // 'mongodb://127.0.0.1:27017' // 
const dbName = 'staple2'
const collectionName = 'Buildings2'


async function loadChildObjectsFromDBForUnion(database, sub, pred, type) {

    if (database.client === undefined) {
        database.client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
    }

    try {
        const db = database.client.db(dbName);
        let collection = db.collection(collectionName);

        let query = { "_id": { "$in": sub } }


        var start = new Date().getTime();
        let result = await collection.find(query).toArray();
        // console.log(query);
        var elapsed = new Date().getTime() - start;
        console.log("\x1b[31m", `MONGO db call took ${elapsed} ms`)

        result = result.map(x => {
            x['@context'] = database.schemaMapping['@context'];
            return x;
        })

        const rdf = await jsonld.toRDF(result, { format: 'application/n-quads' });
        let ids = result.map(x => x['_id'])
        result.map(async t => {
            let tempIds = []

            for (let key in t['_reverse']) {
                tempIds = t['_reverse'][key].map(x => x['_id'])
            }

            ids = [...ids, ...tempIds]
        })

        var start = new Date().getTime();
        await database.insertRDF(rdf, ids);
        var elapsed = new Date().getTime() - start;
        console.log("\x1b[31m", `insertRDF to database took ${elapsed} ms`)


    } catch (err) {
        console.log(err);
    } 
}


// Based on reverse property
async function loadChildObjectsFromDB(database, sub, pred, type) {

    
    if (database.client === undefined) {
        database.client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
    }


    try {
        const db = database.client.db(dbName);
        let collection = db.collection(collectionName);
        let query = { _type: 'Thing' }

        if (type != undefined) {
            query = { _type: type }
        }

        // ???
        let predicateContext = database.schemaMapping["@graph"].filter((x) => { return x['@id'] === pred })[0];
        if (predicateContext !== undefined) {
            if (predicateContext["http://schema.org/inverseOf"].length > 0) {
                query['_reverse'] = {};
                query['_reverse'][database.schemaMapping['@revContext'][pred]] = [{ '_id': sub }]
            }
        }

        var start = new Date().getTime();
        let result = await collection.find(query).toArray();
        // console.log(query);
        var elapsed = new Date().getTime() - start;
        console.log("\x1b[31m", `MONGO db call took ${elapsed} ms`)

        result = result.map(x => {
            x['@context'] = database.schemaMapping['@context'];
            return x;
        })

        const rdf = await jsonld.toRDF(result, { format: 'application/n-quads' });

        let ids = result.map(x => x['_id'])
        result.map(async t => {
            let tempIds = []

            for (let key in t['_reverse']) {
                tempIds = t['_reverse'][key].map(x => x['_id'])
            }

            ids = [...ids, ...tempIds]
        })


        var start = new Date().getTime();
        await database.insertRDF(rdf, sub);
        var elapsed = new Date().getTime() - start;
        console.log("\x1b[31m", `insertRDF to database took ${elapsed} ms`)

    } catch (err) {
        console.log(err);
    }
}

async function loadCoreQueryDataFromDB(database, type, page = 1, query = undefined, inferred = false) {
    
    if (database.client === undefined) {
        database.client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
    }


    try {
        var start2 = new Date().getTime();
        const db = database.client.db(dbName);
        let collection = db.collection(collectionName);
        let _type = undefined;

        if (query === undefined) {
            _type = database.schemaMapping['@revContext'][type];
            // console.log(_type)
        }

        if (_type !== undefined) {
            if (inferred) {
                query = { _inferred: _type }
            }
            else {
                query = { _type: _type }
            }
        }

        var start = new Date().getTime();
        let result;
        if (page === undefined) {
            result = await collection.find(query).toArray();
        }
        else {
            result = await collection.find(query).skip(page * 10 - 10).limit(10).toArray();
            // console.log(query);
        }
        var elapsed = new Date().getTime() - start;
        console.log("\x1b[31m", `MONGO db call took ${elapsed} ms`)

        // save page conetnt
        database.pages[page] = result.map(x => x['_id'])

        result = result.map(x => {
            x['@context'] = database.schemaMapping['@context'];
            return x;
        })

        const rdf = await jsonld.toRDF(result, { format: 'application/n-quads' });
        let ids = result.map(x => x['_id'])

        result.map(async t => {
            let tempIds = []

            for (let key in t['_reverse']) {
                tempIds = t['_reverse'][key].map(x => x['_id'])
            }

            ids = [...ids, ...tempIds]
        })


        var start = new Date().getTime();
        await database.insertRDF(rdf, ids);
        var elapsed = new Date().getTime() - start;
        console.log("\x1b[31m", `insertRDF to database took ${elapsed} ms`)
        var elapsed = new Date().getTime() - start2;
        console.log("\x1b[31m", `loadCoreQueryDataFromDB without connecting took  ${elapsed} ms`)

    } catch (err) {
        console.log(err);
    } 

}

async function mongodbAddOrUpdate(flatJsons) {
    MongoClient.connect(url, async function (err, db) {
        if (err) {
            throw err;
        } else {
            var dbo = db.db(dbName);
            let collection = dbo.collection(collectionName);

            // let result = await collection.find({ "_id": flatJson['_id'] }).toArray();

            // if (result[0] !== undefined) {
            //     collection.update({ _id: flatJson['_id'] }, flatJson);
            // }
            // else {
            //     collection.insertOne(flatJson, function (err, res) {
            //         if (err) throw err;
            //     });
            // }
            collection.insertMany(flatJsons, function (err, res) {
                console.log("dodane do bazy")
                console.log(err)
                if (err) throw err;
            });
            db.close();
        }
    })
}

module.exports = {
    loadChildObjectsFromDB,
    loadCoreQueryDataFromDB,
    mongodbAddOrUpdate,
    loadChildObjectsFromDBForUnion,
};