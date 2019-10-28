/* eslint-disable require-atomic-updates */
const MongoClient = require("mongodb").MongoClient; 
const util = require("util");

var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const databaseCredentials = require(`${appRoot}/config/database`);


async function mongodbAddOrUpdate(flatJsons) {
    MongoClient.connect(databaseCredentials.url, async function (err, db) {
        if (err) {
            throw err;
        } else {
            var dbo = db.db(databaseCredentials.dbName);
            let collection = dbo.collection(databaseCredentials.collectionName);

            let ids = flatJsons.map(flatJson => flatJson["_id"]);
            collection.deleteMany(
                {"_id": { "$in" : ids}},
                // flatJsons,
                // {upsert: true}, 
                // function (err, res) {
                //     if (err) {
                //         logger.error(err);
                //     }
                //     else {
                //         logger.info("Dodano flatJson do bazy")
                //     }
                //     logger.debug(util.inspect(flatJsons, false, null, true))
                // }
                );
            
            // let newFlatJsons = [];

            // for (let flatJson of flatJsons) {
                
            //     let result = await collection.find({ "_id": flatJson['_id'] }).toArray();

            //     if (result[0] !== undefined) {
            //         collection.updateOne({ _id: flatJson['_id'] }, flatJson);
            //     }
            //     else{
            //         newFlatJsons.push(flatJson)
            //     }
            // }

            await collection.insertMany(flatJsons, function (err) {
                if (err) {
                    logger.error(err);
                }
                else {
                    logger.info("Dodano flatJson do bazy");
                }
                logger.debug(util.inspect(flatJsons, false, null, true));
            });


            db.close();
        }
    });
}

module.exports = { 
    mongodbAddOrUpdate, 
};