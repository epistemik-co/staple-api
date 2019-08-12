const MongoClient = require('mongodb').MongoClient;
const jsonld = require('jsonld');
const util = require('util')

const url = 'mongodb://127.0.0.1:27017' // "mongodb+srv://Artur:LR04f444qjPAa6Ul@staple-ximll.mongodb.net/test?retryWrites=true&w=majority";
const dbName = 'staple'
const collectionName = 'quads'



// Based on reverse property
async function loadChildObjectsFromDBForUnion(database, sub, pred, type) {
    // console.log("Someone wants data about ")
    // console.log(sub)
    // console.log(pred)
    // console.log(type)

    const client = await MongoClient.connect(url, { useNewUrlParser: true })
        .catch(err => { console.log(err); });

    if (!client) {
        return;
    }

    try {
        const db = client.db(dbName);
        let collection = db.collection(collectionName);

        let query = { "_id": { "$in": sub } }

        let result = await collection.find(query).toArray();

        result = result.map(x => {
            x['@context'] = database.schemaMapping['@context'];
            return x;
        })

        const rdf = await jsonld.toRDF(result, { format: 'application/n-quads' });
        let ids = result.map( x => x['_id'])
      
        await database.insertRDF(rdf, sub);


    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }
}


// Based on reverse property
async function loadChildObjectsFromDB(database, sub, pred, type) {
    const client = await MongoClient.connect(url, { useNewUrlParser: true })
        .catch(err => { console.log(err); });

    if (!client) {
        return;
    }

    try {
        const db = client.db(dbName);
        let collection = db.collection(collectionName);
        let query = { _type: 'Thing' }

        if (type != undefined) {
            query = { _type: type }
        }

        let predicateContext = database.schemaMapping["@graph"].filter((x) => { return x['@id'] === pred })[0];
        if (predicateContext !== undefined) {
            if (predicateContext["http://schema.org/inverseOf"].length > 0) {
                query['_reverse'] = {};
                query['_reverse'][database.schemaMapping['@revContext'][pred]] = [{ '_id': sub }]
            }
        }

        let result = await collection.find(query).toArray();

        result = result.map(x => {
            x['@context'] = database.schemaMapping['@context'];
            return x;
        })

        const rdf = await jsonld.toRDF(result, { format: 'application/n-quads' });

        let ids = result.map( x => x['_id'])
        console.log(`asking for query`)
        console.log(query)
        console.log(sub)
      
        await database.insertRDF(rdf, sub);

    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }
}

async function loadCoreQueryDataFromDB(database, type, page = 1, query = undefined, inferred = false) {
    const client = await MongoClient.connect(url, { useNewUrlParser: true })
        .catch(err => { console.log(err); });

    if (!client) {
        return;
    }

    try {
        const db = client.db(dbName);
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

        let result;
        if (page === undefined) {
            result = await collection.find(query).toArray();
        }
        else {
            result = await collection.find(query).skip(page * 10 - 10).limit(1).toArray();
        }

        console.log(result)

        // save page conetnt
        database.pages[page] = result.map(x => x['_id'])

        result = result.map(x => {
            x['@context'] = database.schemaMapping['@context'];
            return x;
        })

        const rdf = await jsonld.toRDF(result, { format: 'application/n-quads' });
        console.log(rdf)
        let ids = result.map( x => x['_id'])
        result.map(async t => {
            for(let key in t['_reverse']){
                ids = [...ids, ...t['_reverse'][key].map(x => x['_id'])]
            }
        })
        

        console.log(ids)
        await database.insertRDF(rdf, ids);
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
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
    // loadReversedObjectsFromDB,
};