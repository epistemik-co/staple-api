const createTree = require("../schema/schema-tree");
const createMutationResolvers = require("./mutation-resolver/mutation-resolvers");
const createQueryResolvers = require("./query-resolvers/query-resolvers");
var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

class rootResolver {
    constructor(db, Warnings, schemaMapping, schemaString) {
        this.database = db;
        //Warnings.push({'Message': "Information about object2"})

        this.rootResolver = {};

        this.tree = createTree(schemaMapping);

        // -------------------------------------------------- Create Query resolvers
        

        const queryResolvers = createQueryResolvers(this.database, this.tree, Warnings, schemaMapping);
        this.rootResolver["Query"] = queryResolvers["Query"];

        for (const [key] of Object.entries(queryResolvers["Objects"])) {
            this.rootResolver[key] = queryResolvers["Objects"][key];
        } 
        logger.info("Query Resolvers are ready");


        // const mutationResolvers = createMutationResolvers(this.database, this.tree, Warnings, schemaMapping, schemaString);
        // this.rootResolver["Mutation"] = mutationResolvers;
        

    }
}

module.exports = rootResolver;