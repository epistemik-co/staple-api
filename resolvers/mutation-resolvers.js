const schemaString = require('../schema/schema');
const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaMapping = require('../schema/schema-mapping');
const factory = require('@graphy/core.data.factory');

createMutationResolvers = (database, tree) => {
    const schema = buildSchemaFromTypeDefinitions(schemaString);

    let objectsFromSchemaMapping = [];
    for (var property in tree) { objectsFromSchemaMapping.push(tree[property]); };
    // console.log(objectsFromSchemaMapping)
    // console.log(schemaMapping["@context"])
    // console.log(schemaMapping["@graph"])

    // ADD ROOT MUTATION
    let newResolverBody = {};

    // find mutation 
    const mutation = schema.getTypeMap()['Mutation'].astNode;
    
    for (let field in mutation.fields) {
        // console.log(mutation.fields[field].name.value);

        newResolverBody[mutation.fields[field].name.value] = (args, req) => {
            // Object ID
            console.log("1")
            const objectID = req.input['_id'];
            if (objectID === undefined) {
                return false;
            }

            let fieldName = mutation.fields[field].name.value;
            let fieldFromSchema = objectsFromSchemaMapping.filter(x => x.name === fieldName);
            // console.log(fieldFromSchema)
            fieldFromSchema = fieldFromSchema[0];
            console.log("2")

            if (req.type === "CREATE") {
                if (database.getTriplesBySubject(objectID).length > 0) {
                    return false;
                }
                console.log("3")
                console.log(fieldFromSchema)
                
                for (let propertyName in fieldFromSchema.data) {
                    if (propertyName === '_id') {
                        console.log("4")
                        continue;
                    }
                    else if (propertyName === '_type') {
                        console.log("5")
                        database.create(factory.namedNode(objectID), factory.namedNode(fieldFromSchema.data[propertyName].uri), factory.namedNode(fieldFromSchema.uri));
                    }
                    else {
                        console.log("6")
                        let uri = fieldFromSchema.data[propertyName].uri;
                        let objectFromInput = req.input[fieldFromSchema.data[propertyName].name];
                        //add triple
                        if (objectFromInput !== undefined) {
                            if (objectFromInput['_value'] === undefined) {
                                console.log("7")
                                database.create(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(objectFromInput['_id']));
                            }
                            else {
                                console.log("8")
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
                for (let fieldNumber in fieldFromSchema.fields) {
                    if (fieldFromSchema.fields[fieldNumber].name !== '_id' && fieldFromSchema.fields[fieldNumber].name !== '_type') {
                        let uri = fieldFromSchema.fields[fieldNumber].uri;
                        let objectFromInput = req.input[fieldFromSchema.fields[fieldNumber].name];

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
                for (let fieldNumber in fieldFromSchema.fields) {
                    const currentField = fieldFromSchema.fields[fieldNumber];
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

                for (let fieldNumber in fieldFromSchema.fields) {
                    if (fieldFromSchema.fields[fieldNumber].name !== '_id' && fieldFromSchema.fields[fieldNumber].name !== '_type') {
                        let uri = fieldFromSchema.fields[fieldNumber].uri;
                        let objectFromInput = req.input[fieldFromSchema.fields[fieldNumber].name];

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
                for (let fieldNumber in fieldFromSchema.fields) {
                    if (fieldFromSchema.fields[fieldNumber].name !== '_id' && fieldFromSchema.fields[fieldNumber].name !== '_type') {
                        let uri = fieldFromSchema.fields[fieldNumber].uri;
                        let objectFromInput = req.input[fieldFromSchema.fields[fieldNumber].name];
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