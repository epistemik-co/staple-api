const schemaString = require('../schema/schema');
const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaMapping = require('../schema/schema-mapping');
const { GraphQLError } = require('graphql');
const jsonld = require('jsonld');

function validateIsIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

function validateURI(uri, name) {
    if (uri === undefined) {
        throw new GraphQLError({ key: 'ERROR', message: `Uri for ${name} is not defined in context` });
    }
    var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if (!pattern.test(uri)) {
        throw new GraphQLError({ key: 'ERROR', message: 'The value of all _id keys in the object are valid URIs' });
    }
}

function validateflattenedJson(data) {
    getDepth = function (obj) {
        var depth = 0;
        if (obj.children) {
            obj.children.forEach(function (d) {
                var tmpDepth = getDepth(d)
                if (tmpDepth > depth) {
                    depth = tmpDepth;
                }
            })
        }
        return 1 + depth;
    }
    if (getDepth(data) > 1) {
        throw new GraphQLError({ key: 'ERROR', message: 'The input object is a valid flattened JSON-LD object under the assumed context' });
    }
}

function validateIsObjectInDatabase(database, sub, pred, obj, expect = false, ensureExists = true) {
    if (database.isTripleInDB(sub, pred, obj) === expect) {
        if (ensureExists) {
            throw new GraphQLError({ key: 'ERROR', message: 'The object must exist in the database prior to this request.' });
        }
    }
}

function validateIsIdDefined(id) {
    if (id === undefined) {
        throw new GraphQLError({ key: 'ERROR', message: 'The ID must be defined.' });
    }
}

createMutationResolvers = (database, tree) => {
    const schema = buildSchemaFromTypeDefinitions(schemaString);

    let objectsFromSchemaObjectTree = [];

    for (var property in tree) { objectsFromSchemaObjectTree.push(tree[property]); };

    // ADD ROOT MUTATION
    let newResolverBody = {};

    // find mutation 
    const mutation = schema.getTypeMap()['Mutation'].astNode;

    for (let field in mutation.fields) {

        newResolverBody[mutation.fields[field].name.value] = async (args, req) => {

            // Object ID
            const objectID = req.input['_id'];
            if (req.ensureExists === undefined) {
                req.ensureExists = false;
            }
            validateIsIdDefined(objectID);
            validateURI(objectID, 'id');
            validateflattenedJson(req.input);
            validateIsObjectInDatabase(database, objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing", false, req.ensureExists);


            let fieldName = mutation.fields[field].name.value;
            let fieldFromSchemaTree = objectsFromSchemaObjectTree.filter(x => x.name === fieldName);
            fieldFromSchemaTree = fieldFromSchemaTree[0];

            if (req.type === "INSERT") {
                database.create(objectID, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", fieldFromSchemaTree.uri)

                for (let propertyName in fieldFromSchemaTree.data) {
                    if (propertyName !== '_id' && propertyName !== '_type') {
                        if (req.input[propertyName] !== undefined) {
                            if (fieldFromSchemaTree.data[propertyName].kind !== undefined && fieldFromSchemaTree.data[propertyName].kind === "ListType") {
                                continue;
                            }
                            else {
                                let uri = schemaMapping["@context"][propertyName];
                                validateURI(uri, propertyName);
                                let search = database.getObjectsValueArray((objectID), (uri));
                                if (search.length > 0) {
                                    throw new GraphQLError({ key: 'ERROR', message: `Can not override field: ${propertyName}. The field is already defined in object` });
                                }
                            }
                        }
                    }
                }
            }
            else if (req.type === "UPDATE") {
                database.create(objectID, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", fieldFromSchemaTree.uri)
                // Remove old fields
                for (let propertyName in fieldFromSchemaTree.data) {
                    if (propertyName !== '_id' && propertyName !== '_type') {
                        let uri = schemaMapping["@context"][propertyName];
                        validateURI(uri, propertyName);
                        database.delete((objectID), (uri), undefined);
                    }
                }
            }

            for (let propertyName in fieldFromSchemaTree.data) {
                if (propertyName !== '_id' && propertyName !== '_type') {
                    let uri = schemaMapping["@context"][propertyName];
                    validateURI(uri, propertyName);
                    let objectsFromInput = !validateIsIterable(req.input[propertyName]) ? req.input[propertyName] : [req.input[propertyName]];

                    // console.log(Union type validation)
                    for (let objectFromInput in objectsFromInput) {
                        objectFromInput = objectsFromInput[objectFromInput];
                        if (objectFromInput !== undefined) {

                            let returnType = fieldFromSchemaTree.data[propertyName].kind === "ListType" ?
                                fieldFromSchemaTree.data[propertyName].data.name :
                                fieldFromSchemaTree.data[propertyName].name;

                            returnType = objectsFromSchemaObjectTree.filter(x => x.name === returnType)[0];

                            if (returnType.type === "UnionType") {
                                if (objectFromInput['_id'] !== undefined && objectFromInput['_value'] !== undefined) {
                                    throw new GraphQLError({ key: 'ERROR', message: `Defined id and type properties for ${propertyName} type object. Select only one property.` });
                                }
                                if (objectFromInput['_value'] !== undefined && objectFromInput['_type'] === undefined) {
                                    throw new GraphQLError({ key: 'ERROR', message: `Defined value without type properties for ${propertyName} type object.` });
                                }
                            }
                        }
                    }
                }
            }


            let dataForQuads = req.input;
            dataForQuads["@context"] = schemaMapping["@context"];
            const rdf = await jsonld.toRDF(dataForQuads, { format: 'application/n-quads' });
            req.type === "REMOVE" ? await database.removeRDF(rdf, objectID) : await database.insertRDF(rdf, objectID);


            // Inference

            database.updateInference();
            // console.log(database.getAllQuads())


            return true;
        };
    }

    newResolverBody['DELETE'] = (args, req) => {
        const objectID = req.id;
        validateIsIdDefined(objectID);
        validateIsObjectInDatabase(database, objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing");

        let res = database.deleteID((objectID));

        database.updateInference();

        return res;
    }

    newResolverBody['CREATE'] = (args, req) => {
        const objectID = req.id;
        validateIsIdDefined(objectID);
        validateIsObjectInDatabase(database, objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing", true);

        let res = database.create(objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing");

        database.updateInference();

        return res;
    }

    return newResolverBody;
}

module.exports = createMutationResolvers