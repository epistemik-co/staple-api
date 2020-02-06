let schemaMapping = undefined; // require('../../schema/schema-mapping');
const util = require("util");
var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const handleClassTypeResolver = require("./querys/classTypeResolver");


let createQueryResolvers = (database, tree, Warnings, schemaMappingArg) => {
    // -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE
    schemaMapping = schemaMappingArg;
    let queryResolverBody = {};
    queryResolverBody["Query"] = {};
    queryResolverBody["Objects"] = {};
    queryResolverBody["Data"] = {};

    // -------------------------------------------------- CREATE RESOLVERS
    let objectsFromSchemaObjectTree = [];
    for (var propertyName in tree) { objectsFromSchemaObjectTree.push(tree[propertyName]); }

    for (var object in tree) { 
        if (tree[object].type === "http://www.w3.org/2000/01/rdf-schema#Class") {
            // Core Query
            let uri = tree[object]["uri"];
            let constr = (uri) => {
                return async (parent, args, context, info) => {
                    
                    logger.debug(util.inspect(info["operation"], false, null, true /* enable colors */));
                    logger.info(`Query started for ${uri}`);

                    let data = await database.loadQueryData(info["operation"], uri, args.page, args.inferred, tree);

                    logger.info(
                        `Finall db calls : ${database.dbCallCounter}
                        \tQuads in graphy : ${database.database.size}
                        \tObjects in graphy : ${database.countObjects()}`); 
                    return data;
                };
            };
            queryResolverBody["Query"][tree[object].name] = constr(uri);

            //OBJECT
            let newResolver = tree[object].name;
            queryResolverBody["Objects"][newResolver] = handleClassTypeResolver(tree, object, database, schemaMapping);
        }  
        else if (object === "_CONTEXT") {
            queryResolverBody["Query"]["_CONTEXT"] = () => { return schemaMapping["@context"]; };
        } 
        else {
            logger.warn("UNHANDLED TYPE");
            logger.warn(object);
        }
    }
    return queryResolverBody;
};


module.exports = createQueryResolvers;