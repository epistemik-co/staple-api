const createTree = require('../schema/schema-tree');
const createMutationResolvers = require('./mutation-resolvers');
const createQueryResolvers = require('./query-resolvers');

class rootResolver {
    constructor(db) {
        this.database = db;
        // console.log(schema.getTypeMap()["Person"]);

        this.rootResolver = {}

        this.tree = createTree();

        // -------------------------------------------------- Create Query resolvers
        
        const queryResolvers = createQueryResolvers(this.database, this.tree);
        this.rootResolver["Query"] = queryResolvers["Query"];

        for (const [key, value] of Object.entries(queryResolvers["Objects"])) {
            // console.log(queryResolvers["Query"][key])
            this.rootResolver[key] = queryResolvers["Objects"][key];
        }
        for (const [key, value] of Object.entries(queryResolvers['Data'])) {
            // console.log(queryResolvers['Data'][key])
            this.rootResolver[key] = queryResolvers['Data'][key];
        }

        const mutationResolvers = createMutationResolvers(this.database, this.tree);
        this.rootResolver['Mutation'] = mutationResolvers;
        console.log(this.rootResolver)

    }
}

module.exports = rootResolver