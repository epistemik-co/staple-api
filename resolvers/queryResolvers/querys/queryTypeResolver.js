
const logger = require("../../../config/winston");

/**
 * 
 * Resolver for queries
 * 
 * @param {graphy} database
 * @param {JSON} tree
 * @param {string} uri
 */

const handleQueryTypeResolver = (database, tree, uri) => {
    return async (parent, args, context, info) => {

        logger.info(`Query started for ${uri}`);
        let limit =args.limit;
        let data = await database.loadQueryData(info["operation"], uri, args.page /* undefined*/, args.inferred, tree, args.source, args.filter,limit);
        if (args.source != undefined) {
            if (args.source.length > 1) {
                if (args.page !== undefined) {
                    throw Error("Pagination not allowed on multiple sources!");
                }
            }
        }

        logger.debug(`resolver/queryTypeResolver: handleQueryTypeResolver was called with source: ${args.source}`);
        logger.info(
            `Finall db calls : ${database.dbCallCounter}
            \tQuads in graphy : ${database.database.size}
            \tObjects in graphy : ${database.countObjects()}`);
        return data;
    };
};

module.exports = handleQueryTypeResolver;
