const createTree = require("../schema/schema-tree");
const createMutationResolvers = require("./mutation-resolver/mutation-resolvers");
const createQueryResolvers = require("./query-resolvers/query-resolvers");

class rootResolver {
    constructor(db, Warnings, schemaMapping, schemaString) {
        this.database = db;
        //Warnings.push({'Message': "Information about object2"})
        // console.log(schema.getTypeMap()["Person"]);

        this.rootResolver = {};

        this.tree = createTree(schemaMapping, schemaString);
        // console.log(this.tree)
        // -------------------------------------------------- Create Query resolvers
        

        const queryResolvers = createQueryResolvers(this.database, this.tree, Warnings, schemaMapping);
        this.rootResolver["Query"] = queryResolvers["Query"];


        for (const [key] of Object.entries(queryResolvers["Objects"])) {
            // console.log(queryResolvers["Query"][key])
            this.rootResolver[key] = queryResolvers["Objects"][key];
        }
        for (const [key] of Object.entries(queryResolvers["Data"])) {
            // console.log(queryResolvers['Data'][key])
            this.rootResolver[key] = queryResolvers["Data"][key];
        }

        const mutationResolvers = createMutationResolvers(this.database, this.tree, Warnings, schemaMapping, schemaString);
        this.rootResolver["Mutation"] = mutationResolvers;
        
        // console.log(this.rootResolver)

    }
}

module.exports = rootResolver;