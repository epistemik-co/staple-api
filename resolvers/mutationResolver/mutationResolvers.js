const { buildSchemaFromTypeDefinitions } = require("graphql-tools");
let schemaMapping = undefined;
const appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const classMutations = require("./mutations/classMutations");
// const util = require("util");

const createMutationResolvers = (database, tree, Warnings, schemaMappingArg, schemaString) => {
    logger.info("createMutationResolvers called");
    schemaMapping = schemaMappingArg;
    const schema = buildSchemaFromTypeDefinitions(schemaString);

    let newResolverBody = {};
    const mutation = schema.getTypeMap()["Mutation"].astNode;

    for (let field of mutation.fields) {
        newResolverBody[field.name.value] = classMutations(database, schemaMapping, tree, field, mutation, field );
    }

    return newResolverBody;
};


module.exports = createMutationResolvers;