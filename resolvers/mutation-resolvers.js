const schemaString = require('../schema/schema');
const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaMapping = require('../schema/schema-mapping');
const factory = require('@graphy/core.data.factory');

createMutationResolvers = (database, tree) => {
    const schema = buildSchemaFromTypeDefinitions(schemaString);

    let objectsFromSchemaMapping = [];
    for (var property in schemaMapping.types) { objectsFromSchemaMapping.push(schemaMapping.types[property]); };

    // ADD ROOT MUTATION
    let newResolverBody = {};

    // find mutation 
    const mutation = schema.getTypeMap()['Mutation'].astNode;
    for (let field in mutation.fields) {
        console.log(mutation.fields[field].name.value);

        newResolverBody[mutation.fields[field].name.value] = (args, req) => {
            // Object ID
            const objectID = req.input['_id'];
            if (objectID === undefined) {
                return false;
            }

            let fieldName = mutation.fields[field].name.value;
            let fieldFromMapping = objectsFromSchemaMapping.filter(x => x.name === fieldName);
            fieldFromMapping = fieldFromMapping[0];

            if (req.type === "CREATE") {
                if (database.getTriplesBySubject(objectID).length > 0) {
                    return false;
                }

                for (let fieldNumber in fieldFromMapping.fields) {
                    if (fieldFromMapping.fields[fieldNumber].name === '_id') {
                        continue;
                    }
                    else if (fieldFromMapping.fields[fieldNumber].name === '_type') {
                        database.create(factory.namedNode(objectID), factory.namedNode(fieldFromMapping.fields[fieldNumber].uri), factory.namedNode(fieldFromMapping.uri));
                    }
                    else {
                        let uri = fieldFromMapping.fields[fieldNumber].uri;
                        let objectFromInput = req.input[fieldFromMapping.fields[fieldNumber].name];
                        //add triple
                        if (objectFromInput !== undefined) {
                            if (objectFromInput['_value'] === undefined) {
                                database.create(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(objectFromInput['_id']));
                            }
                            else {
                                let objForQuery = factory.literal(objectFromInput['_value']);
                                objForQuery.datatype = factory.namedNode("http://schema.org/" + objectFromInput['_type']);
                                database.create(factory.namedNode(objectID), factory.namedNode(uri), objForQuery);
                            }
                        }
                    }
                }

                return true;
            }
            else if (req.type === "UPDATE") {
                for (let fieldNumber in fieldFromMapping.fields) {
                    if (fieldFromMapping.fields[fieldNumber].name !== '_id' && fieldFromMapping.fields[fieldNumber].name !== '_type') {
                        let uri = fieldFromMapping.fields[fieldNumber].uri;
                        let objectFromInput = req.input[fieldFromMapping.fields[fieldNumber].name];

                        database.delete(factory.namedNode(objectID), factory.namedNode(uri), undefined);

                        if (objectFromInput !== undefined) {
                            if (objectFromInput['_value'] === undefined) {
                                database.create(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(objectFromInput['_id']));
                            }
                            else {
                                let objForQuery = factory.literal(objectFromInput['_value']);
                                objForQuery.datatype = factory.namedNode("http://schema.org/" + objectFromInput['_type']);
                                database.create(factory.namedNode(objectID), factory.namedNode(uri), objForQuery);
                            }
                        }
                    }
                }
                return true;
            }
            else if (req.type === "INSERT") {
                // validation
                for (let fieldNumber in fieldFromMapping.fields) {
                    const currentField = fieldFromMapping.fields[fieldNumber];
                    if (currentField.name !== '_id' && currentField.name !== '_type') {
                        if (req.input[currentField.name] !== undefined) {
                            // if it is a list, then it is ok
                            if (tree[fieldName].data[currentField.name].kind !== undefined && tree[fieldName].data[currentField.name].kind === "ListType") {
                                continue;
                            }
                            else {
                                let search = database.getObjs(objectID, currentField.uri);
                                if (search.length > 0) {
                                    return false;
                                }
                            }
                        }
                    }
                }

                for (let fieldNumber in fieldFromMapping.fields) {
                    if (fieldFromMapping.fields[fieldNumber].name !== '_id' && fieldFromMapping.fields[fieldNumber].name !== '_type') {
                        let uri = fieldFromMapping.fields[fieldNumber].uri;
                        let objectFromInput = req.input[fieldFromMapping.fields[fieldNumber].name];

                        if (objectFromInput !== undefined) {
                            if (objectFromInput['_value'] === undefined) {
                                database.create(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(objectFromInput['_id']));
                            }
                            else {
                                let objForQuery = factory.literal(objectFromInput['_value']);
                                objForQuery.datatype = factory.namedNode("http://schema.org/" + objectFromInput['_type']);
                                database.create(factory.namedNode(objectID), factory.namedNode(uri), objForQuery);
                            }
                        }
                    }
                }
                return true;
            }
            else if (req.type === "REMOVE") {
                for (let fieldNumber in fieldFromMapping.fields) {
                    if (fieldFromMapping.fields[fieldNumber].name !== '_id' && fieldFromMapping.fields[fieldNumber].name !== '_type') {
                        let uri = fieldFromMapping.fields[fieldNumber].uri;
                        let objectFromInput = req.input[fieldFromMapping.fields[fieldNumber].name];
                        if (objectFromInput !== undefined) {
                            if (objectFromInput['_value'] === undefined) {
                                database.delete(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(objectFromInput['_id']));
                            }
                            else {
                                let objForQuery = factory.literal(objectFromInput['_value']);
                                objForQuery.datatype = factory.namedNode("http://schema.org/" + objectFromInput['_type']);
                                database.delete(factory.namedNode(objectID), factory.namedNode(uri), objForQuery);
                            }
                        }
                    }
                }
                return true;
            }

            return false;
        };
    }

    newResolverBody['Delete'] = (args, req) => {
        const objectID = req.id;
        if (objectID === undefined) {
            return false;
        }
        return database.deleteID(factory.namedNode(objectID));
    }

    return newResolverBody;
}


module.exports = createMutationResolvers