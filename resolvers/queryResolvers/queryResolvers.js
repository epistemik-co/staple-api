let schemaMapping = undefined; // require('../../schema/schema-mapping');
const logger = require(`../../config/winston`);
const handleClassTypeResolver = require("./querys/classTypeResolver");
const handleQueryTypeResolver = require("./querys/queryTypeResolver");


let createQueryResolvers = (database, tree, Warnings, schemaMappingArg) => {
    // -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE
    schemaMapping = schemaMappingArg;
    let queryResolverBody = {};
    queryResolverBody["Query"] = {};
    queryResolverBody["Objects"] = {};

    // -------------------------------------------------- CREATE RESOLVERS
    let objectsFromSchemaObjectTree = [];
    for (var propertyName in tree) { objectsFromSchemaObjectTree.push(tree[propertyName]); }

    for (var object in tree) { 
        if (tree[object].type === "http://www.w3.org/2000/01/rdf-schema#Class") {
            // Core Query
            let uri = tree[object]["uri"];
            queryResolverBody["Query"][tree[object].name] = handleQueryTypeResolver(database, tree, uri);

            //OBJECT
            let newResolver = tree[object].name;
            queryResolverBody["Objects"][newResolver] = handleClassTypeResolver(tree, object, database, schemaMapping);
        }   
        else if (tree[object].type === "EnumType") {
            continue;
        } 
        else if (object === "_CONTEXT") {
            queryResolverBody["Query"]["_CONTEXT"] = () => { return schemaMapping["@context"]; };
        }
        else {
            logger.warn(`UNHANDLED TYPE: ${object}`);
        }
    }


    
    return queryResolverBody;
};
 


module.exports = createQueryResolvers;