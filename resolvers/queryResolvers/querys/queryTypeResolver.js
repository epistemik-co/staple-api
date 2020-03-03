
const logger = require(`../../../config/winston`);
const util = require("util");

const handleQueryTypeResolver = (database, tree, uri) => {
    return async (parent, args, context, info) => {

        // logger.debug(util.inspect(info["operation"], false, null, true /* enable colors */));
        logger.info(`Query started for ${uri}`); 
        let data = await database.loadQueryData(info["operation"], uri, args.page /* undefined*/, args.inferred, tree, args.source);

        if (args.source.length > 1){
            if (args.page !== undefined){
                throw Error("Pagination not allowed on multiple sources!");
            }
        }

        logger.debug(`resolver/queryTypeResolver: handleQueryTypeResolver was called with source: ${args.source}`)
        logger.info(
            `Finall db calls : ${database.dbCallCounter}
            \tQuads in graphy : ${database.database.size}
            \tObjects in graphy : ${database.countObjects()}`);
        return data;
    };
};

module.exports = handleQueryTypeResolver;