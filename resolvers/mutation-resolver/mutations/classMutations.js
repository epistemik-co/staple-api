// const { GraphQLError } = require("graphql");
// const jsonld = require("jsonld");
// const validators = require("./validate-functions");
const appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const util = require("util");

// function classMutations(database, mutation, field, schemaMapping, objectsFromSchemaObjectTree) {
function classMutations(database) {
    return async (args, req) => {
        logger.info("Class mutation was called");
        console.log(util.inspect(req, false, null, true));

        // VALIDATION

        // db push object

        if(req.type === "PUT"){
            console.log(req.input);
            await database.pushObjectToBackend(req.input);
        }

        return true;

    };

}
 
module.exports = classMutations;