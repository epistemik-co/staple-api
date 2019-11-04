const schemaString = require("../../schema/schema");
const { buildSchemaFromTypeDefinitions } = require("graphql-tools");
let schemaMapping = undefined; // require('../../schema/schema-mapping');
const { GraphQLError } = require("graphql");
const jsonld = require("jsonld");
const validators = require("./validate-functions");
const appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
// const util = require("util");

const beforeInsert = (database, objectID, fieldFromSchemaTree, req) => {
    database.create(objectID, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", fieldFromSchemaTree.uri);
    // Validation for single value types
    for (let propertyName in fieldFromSchemaTree.data) {
        if (propertyName !== "_id" && propertyName !== "_type") {
            if (req.input[propertyName] !== undefined) {
                if (fieldFromSchemaTree.data[propertyName].kind !== undefined && fieldFromSchemaTree.data[propertyName].kind === "ListType") {
                    continue;
                }
                else {
                    let uri = schemaMapping["@context"][propertyName];
                    validators.validateURI(uri, propertyName);
                    let search = database.getObjectsValueArray((objectID), (uri));
                    if (search.length > 0) {
                        throw new GraphQLError({ key: "ERROR", message: `Can not override field: ${propertyName}. The field is already defined in object` });
                    }
                }
            }
        }
    }
};

const beforeUpdate = (database, objectID, fieldFromSchemaTree) => {
    database.create(objectID, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", fieldFromSchemaTree.uri);
    // Remove old fields
    for (let propertyName in fieldFromSchemaTree.data) {
        if (propertyName !== "_id" && propertyName !== "_type") {
            let uri = schemaMapping["@context"][propertyName];

            validators.validateURI(uri, propertyName);
            database.delete((objectID), (uri), undefined);
        }
    }
};

const createMutationResolvers = (database, tree, Warnings, schemaMappingArg) => {
    schemaMapping = schemaMappingArg;
    const schema = buildSchemaFromTypeDefinitions(schemaString);
    let objectsFromSchemaObjectTree = [];

    for (var property in tree) { objectsFromSchemaObjectTree.push(tree[property]); }

    let newResolverBody = {};
    const mutation = schema.getTypeMap()["Mutation"].astNode;

    for (let field in mutation.fields) {
        newResolverBody[mutation.fields[field].name.value] = async (args, req) => {
            const objectID = req.input["_id"];
            await database.loadObjectsByUris(objectID); 

            req.ensureExists = req.ensureExists === undefined ? false : req.ensureExists;

            validators.validateIsIdDefined(objectID);
            validators.validateURI(objectID, "id");
            validators.validateflattenedJson(req.input);
            validators.validateIsObjectInDatabase(database, objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing", false, req.ensureExists);

            let fieldName = mutation.fields[field].name.value;
            let fieldFromSchemaTree = objectsFromSchemaObjectTree.filter(x => x.name === fieldName);
            fieldFromSchemaTree = fieldFromSchemaTree[0];

            if (req.type === "INSERT") {
                logger.info("INSERT");
                beforeInsert(database, objectID, fieldFromSchemaTree, req);
            }
            else if (req.type === "UPDATE") {
                beforeUpdate(database, objectID, fieldFromSchemaTree);
            }
            logger.info("After insert");
            validators.validateUnion(fieldFromSchemaTree, schemaMapping, req, objectsFromSchemaObjectTree);

            let dataForQuads = req.input;
            dataForQuads["@context"] = schemaMapping["@context"]; 
            const rdf = await jsonld.toRDF(dataForQuads, { format: "application/n-quads" });
            logger.info("AFTER RDF");
            // await validators.validateData(database, objectID, rdf, req.ensureExists, req.type, Warnings)
            logger.info("After data validation");
            req.type === "REMOVE" ? await database.removeRDF(rdf, objectID) : await database.insertRDF(rdf);


            // Inference
            database.updateInference();
            // logger.info("await this.database.getFlatJson()"); 
            await database.pushObjectToBackend(objectID);
            return true;
        };
    }

    newResolverBody["DELETE"] = async (args, req) => {
        const objectID = req.id;
        await database.loadObjectsByUris(objectID);
        validators.validateIsIdDefined(objectID);
        validators.validateURI(objectID, "id");
        validators.validateIsObjectInDatabase(database, objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing");

        let res = database.deleteID((objectID));

        database.updateInference();

        await database.pushObjectToBackend(objectID);
        return res;
    };

    newResolverBody["CREATE"] = async (args, req) => {
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

    return newResolverBody;
};

module.exports = createMutationResolvers;