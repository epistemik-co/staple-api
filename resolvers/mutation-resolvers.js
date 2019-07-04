const schemaString = require('../schema/schema');
const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaMapping = require('../schema/schema-mapping');
const factory = require('@graphy/core.data.factory');
const { GraphQLError } = require('graphql');

function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
  }

createMutationResolvers = (database, tree) => {
    const schema = buildSchemaFromTypeDefinitions(schemaString);

    let objectsFromSchemaObjectTree = [];

    for (var property in tree) { objectsFromSchemaObjectTree.push(tree[property]); };
    // console.log(objectsFromSchemaMapping)
    // console.log(schemaMapping["@context"])
    // console.log(schemaMapping["@graph"])

    // ADD ROOT MUTATION
    let newResolverBody = {};

    // find mutation 
    const mutation = schema.getTypeMap()['Mutation'].astNode;

    for (let field in mutation.fields) {

        newResolverBody[mutation.fields[field].name.value] = (args, req) => {
            // Object ID
            const objectID = req.input['_id'];
            if (objectID === undefined) {
                return false;
            }

            let fieldName = mutation.fields[field].name.value;
            let fieldFromSchemaTree = objectsFromSchemaObjectTree.filter(x => x.name === fieldName);
            fieldFromSchemaTree = fieldFromSchemaTree[0];


            if (req.type === "CREATE") {
                if (database.getTriplesBySubject(factory.namedNode(objectID)).length > 0) {
                    throw new GraphQLError({ key: 'Duplicate', message: 'Object with given ID is already deffined in database' });
                }
                database.create(factory.namedNode(objectID), factory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), factory.namedNode(fieldFromSchemaTree.uri));
            }
            else if (req.type === "UPDATE") {
                // Need to be created
                if (database.getTriplesBySubject(factory.namedNode(objectID)).length === 0) {
                    throw new GraphQLError({ key: 'Object not found', message: 'Object with given ID is not deffined in database' });
                }
                // Remove old fields
                for (let propertyName in fieldFromSchemaTree.data) {
                    if (propertyName !== '_id' && propertyName !== '_type') {
                        let uri = schemaMapping["@context"][propertyName];
                        if (uri === undefined) {
                            uri = "http://schema.org/" + propertyName;
                        }
                        database.delete(factory.namedNode(objectID), factory.namedNode(uri), undefined);
                    }
                }
            }
            else if (req.type === "INSERT") {
                // // Need to be created
                // if (database.getTriplesBySubject(objectID).length === 0) {
                //     return false;
                // }
                // Validation 
                for (let propertyName in fieldFromSchemaTree.data) {
                    if (propertyName !== '_id' && propertyName !== '_type') {
                        if (req.input[propertyName] !== undefined) {
                            if (fieldFromSchemaTree.data[propertyName].kind !== undefined && fieldFromSchemaTree.data[propertyName].kind === "ListType") {
                                continue;
                            }
                            else {
                                let uri = schemaMapping["@context"][propertyName];
                                if (uri === undefined) {
                                    uri = "http://schema.org/" + propertyName;
                                }
                                let search = database.getObjectsValueArray(factory.namedNode(objectID), factory.namedNode(uri));
                                if (search.length > 0) {
                                    throw new GraphQLError({ key: 'Can not override field: ' + propertyName, message: 'Field already defined in object' });
                                }
                            }
                        }
                    }
                }
            }

            database.selectedOperation = req.type === "REMOVE" ? database.delete : database.create;

            for (let propertyName in fieldFromSchemaTree.data) {
                if (propertyName !== '_id' && propertyName !== '_type') {
                    let uri = schemaMapping["@context"][propertyName];
                    if (uri === undefined) {
                        // throw new GraphQLError({ key: `Uri not found`, message: 'URI for: {propertyName} was not found' });
                        uri = "http://schema.org/" + propertyName;
                    }

                    //let objectFromInput = req.input[propertyName];
                    // console.log(req.input[propertyName])
                    let objectsFromInput = req.input[propertyName];
                    if(!isIterable(req.input[propertyName])){
                        objectsFromInput = [req.input[propertyName]]; 
                    }
                    // console.log(objectsFromInput)
                    for (let objectFromInput in objectsFromInput) {
                        objectFromInput = objectsFromInput[objectFromInput];
                        if (objectFromInput !== undefined) {
                            // console.log(objectFromInput)

                            let returnType = "";
                            if (fieldFromSchemaTree.data[propertyName].kind === "ListType") {
                                returnType = fieldFromSchemaTree.data[propertyName].data.name;
                            }
                            else {
                                returnType = fieldFromSchemaTree.data[propertyName].name;
                            }
                            returnType = objectsFromSchemaObjectTree.filter(x => x.name === returnType)[0];

                            if (returnType.type === "http://www.w3.org/2000/01/rdf-schema#Class") {
                                database.selectedOperation(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(objectFromInput['_id']));
                            }
                            else if (returnType.type === "UnionType") {
                                // console.log("UNION TYPE")
                                if (objectFromInput['_id'] !== undefined && objectFromInput['_value'] !== undefined) {
                                    throw new GraphQLError({ key: `Defined all three properties for ${propertyName} type object.`, message: 'Select only one property.' });
                                }

                                uriFromInput = uri;
                                uri = tree[ fieldFromSchemaTree.data[propertyName].data.name].values;
                                uri = uri.map(x => schemaMapping["@context"][x]);

                                if (uri.includes(schemaMapping["@context"][objectFromInput['_type']])) {
                                    let type = schemaMapping["@graph"].filter(x => x['@id'] === schemaMapping["@context"][objectFromInput['_type']])[0]['@type']; // scary !

                                    if (type === "http://schema.org/DataType") {
                                        let objForQuery = factory.literal(objectFromInput['_value']);
                                        objForQuery.datatype = factory.namedNode(schemaMapping["@context"][objectFromInput['_type']]);
                                        database.selectedOperation(factory.namedNode(objectID), factory.namedNode(uriFromInput), objForQuery);
                                    }
                                    else {
                                        database.selectedOperation(factory.namedNode(objectID), factory.namedNode(uriFromInput), factory.namedNode(objectFromInput['_id']));
                                    }
                                }
                            }
                            else if (returnType.type === "http://schema.org/DataType") {
                                let objForQuery = factory.literal(objectFromInput['_value']);
                                objForQuery.datatype = factory.namedNode("http://schema.org/" + objectFromInput['_type']);
                                database.selectedOperation(factory.namedNode(objectID), factory.namedNode(uri), objForQuery);
                            }
                            else {
                                console.log("UNHANDLED TYPE")
                            }
                        }
                    }
                }
            }

            // testQuads = database.getTriplesBySubject("http://subject");
            // console.log("\n\n")
            // console.log(testQuads)

            console.log(database.getAllQuads())
            return true;


        };
    }

    newResolverBody['DELETE'] = (args, req) => {
        const objectID = req.id;
        if (objectID === undefined) {
            return false;
        }
        return database.deleteID(factory.namedNode(objectID));
    }

    return newResolverBody;
}


module.exports = createMutationResolvers