const schemaString = require("../../schema/schema");
const { buildSchemaFromTypeDefinitions } = require("graphql-tools");
let schemaMapping = undefined;
const appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const createMutation = require("./mutations/createMutation");
const deleteMutation = require("./mutations/deleteMutation");
const classMutations = require("./mutations/classMutations");
// const util = require("util");

const createMutationResolvers = (database, tree, Warnings, schemaMappingArg) => {
    logger.info("createMutationResolvers called");
    schemaMapping = schemaMappingArg;
    const schema = buildSchemaFromTypeDefinitions(schemaString);
    let objectsFromSchemaObjectTree = [];

    for (var property in tree) { objectsFromSchemaObjectTree.push(tree[property]); }

    let newResolverBody = {};
    const mutation = schema.getTypeMap()["Mutation"].astNode;

    for (let field in mutation.fields) {
        newResolverBody[mutation.fields[field].name.value] = classMutations(database, mutation, field, schemaMapping, objectsFromSchemaObjectTree);
    }

    newResolverBody["DELETE"] = deleteMutation(database);

    newResolverBody["CREATE"] = createMutation(database);

    return newResolverBody;
};


module.exports = createMutationResolvers;