const { buildSchemaFromTypeDefinitions } = require("graphql-tools");
let schemaMapping = undefined;
const appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const classMutations = require("./mutations/classMutations");
const deleteMutation = require("./mutations/deleteMutation");
// const util = require("util");

const createMutationResolvers = (database, tree, Warnings, schemaMappingArg, schemaString) => {
    logger.info("createMutationResolvers called");
    schemaMapping = schemaMappingArg;
    const schema = buildSchemaFromTypeDefinitions(schemaString);

    let newResolverBody = {};
    const mutation = schema.getTypeMap()["Mutation"].astNode;
    for (let field of mutation.fields) {
        if(field.name.value === "DELETE"){
            newResolverBody[field.name.value] = deleteMutation(database);
        }
        else{
            newResolverBody[field.name.value] = classMutations(database, schemaMapping, tree, field, mutation, field );
        }
    }

    return newResolverBody;
};


module.exports = createMutationResolvers;