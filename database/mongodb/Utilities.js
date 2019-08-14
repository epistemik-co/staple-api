const MongoClient = require('mongodb').MongoClient;
const jsonld = require('jsonld');
const util = require('util');

var appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/winston`);
const databaseCredentials = require(`${appRoot}/config/database`);

// const databaseCredentials.url = "mongodb+srv://Artur:LR04f444qjPAa6Ul@staple-ximll.mongodb.net/test?retryWrites=true&w=majority";  //'mongodb://127.0.0.1:27017' //  
// const databaseCredentials.dbName = 'staple2'
// const databaseCredentials.collectionName = 'Buildings2'


async function loadChildObjectsByUris(database, sub, pred, type) {
    logger.log('info', 'loadChildObjectsByUris was called')
    if (database.client === undefined) {
        database.client = await MongoClient.connect(databaseCredentials.url, { useNewUrlParser: true }).catch(err => { logger.error(err); });
    }

    try {
        const db = database.client.db(databaseCredentials.dbName);
        let collection = db.collection(databaseCredentials.collectionName);

        let query = { "_id": { "$in": sub } }


        logger.debug(`Mongo db query:\n${util.inspect(query, false, null, true /* enable colors */)}`);
        let result = await collection.find(query).toArray();

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

        logger.debug(`Graphy database rdf insert start`);
        await database.insertRDF(rdf, ids);
        logger.debug(`Graphy database rdf insert end`);


    } catch (err) {
        logger.error(err);
    }
}

async function loadCoreQueryDataFromDB(database, type, page = 1, query = undefined, inferred = false) {

    if (database.client === undefined) {
        database.client = await MongoClient.connect(databaseCredentials.url, { useNewUrlParser: true }).catch(err => { logger.error(err); });
    }


    try {
        var start2 = new Date().getTime();
        const db = database.client.db(databaseCredentials.dbName);
        let collection = db.collection(databaseCredentials.collectionName);
        let _type = undefined;

        if (query === undefined) {
            _type = database.schemaMapping['@revContext'][type];
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
            logger.debug(`Mongo db query:\n${util.inspect(query, false, null, true /* enable colors */)}`);
            result = await collection.find(query).skip(page * 10 - 10).limit(10).toArray();
        }

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

        logger.debug(`Graphy database rdf insert start`);
        await database.insertRDF(rdf, ids);
        logger.debug(`Graphy database rdf insert end`);

    } catch (err) {
        logger.error(err);
    }

}

async function mongodbAddOrUpdate(flatJsons) {
    MongoClient.connect(databaseCredentials.url, async function (err, db) {
        if (err) {
            throw err;
        } else {
            var dbo = db.db(databaseCredentials.dbName);
            let collection = dbo.collection(databaseCredentials.collectionName);

            // let result = await collection.find({ "_id": flatJson['_id'] }).toArray();

            // if (result[0] !== undefined) {
            //     collection.update({ _id: flatJson['_id'] }, flatJson);
            // }
            // else {
            //     collection.insertOne(flatJson, function (err, res) {
            //         if (err) throw err;
            //     });
            // }
            await collection.insertMany(flatJsons, function (err, res) {
                if (err) {
                    logger.error(err);
                }
                else {
                    logger.info("Dodano flatJson do bazy")
                }
                logger.debug(util.inspect(flatJsons, false, null, true))
            });
            db.close();
        }
    })
}

module.exports = {
    loadCoreQueryDataFromDB,
    mongodbAddOrUpdate,
    loadChildObjectsByUris,
};