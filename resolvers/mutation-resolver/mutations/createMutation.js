
const validators = require("./validate-functions");

function createMutation(database) {
    return async (args, req) => {
        const objectID = req.id;
        await database.loadObjectsByUris(objectID);
        validators.validateIsIdDefined(objectID);
        validators.validateURI(objectID, "id");
        validators.validateIsObjectInDatabase(database, objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing", true);

        let res = database.create(objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing");

        database.updateInference();

        await database.pushObjectToBackend(objectID);
        return res;
    };
}

module.exports = createMutation;