const logger = require("../../../config/winston");
const util = require("util");

/**
 * 
 * Loads data for queries -> calls searchForDataRecursively
 * 
 * @param {graphy} database
 * @param {} queryInfo
 * @param {} uri
 * @param {int} page
 * @param {boolean} inferred
 * @param {JSOM} tree
 * @param {string} source
 */

async function loadQueryData(database, queryInfo, uri, page, inferred, tree,filter, source) {
    database.dbCallCounter = 0; // debug only
    database.drop(); // clear db before new query.

    let coreIds = [];
    let resolverName = database.schemaMapping["@revContext"][uri];
    if (resolverName === undefined) {
        return;
    }

    let coreSelectionSet = queryInfo["selectionSet"];

    for (let coreSelection in coreSelectionSet["selections"]) {
        let selectionSet = coreSelectionSet["selections"][coreSelection];
        if (resolverName == coreSelectionSet["selections"][coreSelection].name.value) {
            await database.loadCoreQueryDataFromDB(uri, page, selectionSet, inferred, tree, source, filter);
            coreIds = await database.getSubjectsByType(uri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", inferred, page);
            await searchForDataRecursively(database, coreSelectionSet["selections"][coreSelection]["selectionSet"], coreIds, tree, resolverName,/*source*/ undefined, /*parent Query Source*/source, filter);
        }
    }

    return coreIds;
}


/**
 * 
 * Searches for data recursively within cache db, if not found then fetches data from data source
 * 
 * @param {graphy} database
 * @param {JSON} selectionSet
 * @param {string} uri
 * @param {JSON} tree
 * @param {string} parentName
 * @param {string} source source
 * @param {string} parentQuerySource
 */


async function searchForDataRecursively(database, selectionSet, uri, tree, parentName = undefined, source = undefined, parentQuerySource = undefined) {
    logger.info("dataRetrievalAlgorithm: searchForDataRecursively was called");
    logger.debug(`Started function searchForDataRecursively with args:
    \tsource : ${source}
    \tparentQuerySource: ${parentQuerySource}
    `);

    let name = undefined;
    for (let selection of selectionSet["selections"]) {
        if (selection.kind === "InlineFragment") {
            await searchForDataRecursively(database, selection["selectionSet"], uri, tree, parentName, source);
        }
        //if there is any selection
        else if (selection["selectionSet"] !== undefined && selection.name !== undefined) {
            logger.debug("Looking for:");
            logger.debug(selection.kind);
            logger.debug(util.inspect(selection.name, false, null, true));

            name = selection.name.value;
            let newUris = new Set();
            let type = database.schemaMapping["@context"][name];

            //TODO error handling
            //if arguments in selection
            if (selection.arguments.length > 0) {
                //read source from argument
                if (selection.arguments[0].value.values !== undefined) {
                    source = selection.arguments[0].value.values;
                    source = source.map(e => e.value);
                } else {
                    source = selection.arguments[0].value.value;
                }
            //else read source from parentQuerySource
            } else {
                source = parentQuerySource;
            }
            //if there s no arguments for selection set then source should be the same as parent query source
            //else if there is an argument source, then source should be switched for argument

            logger.debug(`After reading args:
            \tsource : ${source}
            \tparentQuerySource: ${parentQuerySource}
            `);

            //gets data for already existing 
            for (let id of uri) {
                let data = [];

                data = await database.getObjectsValueArray(id, type);
                logger.debug("Asked for ID TYPE");
                logger.debug(util.inspect(id, false, null, true));
                logger.debug(util.inspect(type, false, null, true));

                for (let x of data) {
                    // eslint-disable-next-line no-useless-escape
                    var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                    if (pattern.test(x)) {
                        newUris.add(x);
                    }
                }
            }

            newUris = [...newUris];

            if (newUris.length > 0) {
                await database.loadChildObjectsByUris(newUris, selection, tree, parentName, /*source needs to be specified here or it will use default*/source);

                let newParentName = tree[parentName].data[name];
                if (newParentName === undefined) {
                    newParentName = {};
                }
                newParentName = newParentName.name;
                //FIXME: in nested queries this part is runnning slow
                await searchForDataRecursively(database, selection["selectionSet"], newUris, tree, newParentName, undefined, source);
            }

        }
        else {
            logger.debug("Skiped object from query");
            logger.debug(selection.kind);
            logger.debug(util.inspect(selection.name, false, null, true));
        }
    }
}


module.exports = {
    loadQueryData,
    searchForDataRecursively,
};