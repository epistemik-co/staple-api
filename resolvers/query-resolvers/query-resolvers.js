let schemaMapping = undefined; // require('../../schema/schema-mapping');
const util = require("util");
var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const handleDataTypeResolver = require("./querys/dataTypeResolver");
const handleClassTypeResolver = require("./querys/classTypeResolver");
const handleUnionTypeResolver = require("./querys/unionTypeResolver");


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

        if (tree[object].type === "http://schema.org/DataType") {
            let newResolver = tree[object].name;
            queryResolverBody["Data"][newResolver] = handleDataTypeResolver(tree, object, schemaMapping);
        }
        else if (tree[object].type === "http://www.w3.org/2000/01/rdf-schema#Class") {
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
        else if (tree[object].type === "UnionType") {
            let newResolver = tree[object].name;
            queryResolverBody["Data"][newResolver] = handleUnionTypeResolver(tree, object, database, schemaMapping);
        }
        else if (tree[object].type === "EnumType") {
            //...
        } 
        else if (object === "_CONTEXT") {
            queryResolverBody["Query"]["_CONTEXT"] = () => { return schemaMapping["@context"]; };
        }
        else if (object === "_OBJECT") {
            queryResolverBody["Query"]["_OBJECT"] = async (obj, args, context, info) => {
                logger.debug(util.inspect(info["operation"], false, null, true /* enable colors */));
                let data = await database.loadQueryData(info["operation"], "http://schema.org/Thing", args.page, true, tree);
                data = data.map(async (id) => { return { "_id": id, "_type": await database.getObjectsValueArray(id, database.stampleDataType) }; });
                return data;
            };
        }
        else {
            logger.warn("UNHANDLED TYPE");
            logger.warn(object);
            logger.warn(tree[object].type);
        }
    }
    return queryResolverBody;
};


module.exports = createQueryResolvers;