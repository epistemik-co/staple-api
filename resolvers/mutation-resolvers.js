const schemaString = require('../schema/schema');
const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaMapping = require('../schema/schema-mapping');
const factory = require('@graphy/core.data.factory');
const { GraphQLError } = require('graphql');
const jsonld = require('jsonld');

function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

function validateURI(uri) {
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
    if(getDepth(data) > 1){
        throw new GraphQLError({ key: 'ERROR', message: 'The input object is a valid flattened JSON-LD object under the assumed context' });
    }
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

        newResolverBody[mutation.fields[field].name.value] = async (args, req) => {

            // Object ID
            const objectID = req.input['_id'];
            if (objectID === undefined) {
                return false;
            }
            validateURI(objectID);
            validateflattenedJson(req.input);

            console.log(req.input['_type'])

            let fieldName = mutation.fields[field].name.value;
            let fieldFromSchemaTree = objectsFromSchemaObjectTree.filter(x => x.name === fieldName);
            fieldFromSchemaTree = fieldFromSchemaTree[0];



            if (req.type === "UPDATE") {
                // Need to be created
                if (database.getTriplesBySubject((objectID)).length === 0) {
                    throw new GraphQLError({ key: 'Object not found', message: 'Object with given ID is not deffined in database' });
                }
                // Remove old fields
                for (let propertyName in fieldFromSchemaTree.data) {
                    if (propertyName !== '_id' && propertyName !== '_type') {
                        let uri = schemaMapping["@context"][propertyName];
                        if (uri === undefined) {
                            throw new GraphQLError({ key: 'ERROR', message: `Uri for ${propertyNameField} is not defined in context` });
                        }
                        database.delete((objectID), (uri), undefined);
                    }
                }
            }
            else if (req.type === "INSERT") {
                database.create(objectID, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" ,fieldFromSchemaTree.uri)

                if(req.ensureExists){
                    if (!database.isTripleInDB(objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing")) {
                        throw new GraphQLError({ key: 'ERROR', message: 'The object must exist in the database prior to this request.' });
                    }
                }

                for (let propertyName in fieldFromSchemaTree.data) {
                    if (propertyName !== '_id' && propertyName !== '_type') {
                        if (req.input[propertyName] !== undefined) {
                            if (fieldFromSchemaTree.data[propertyName].kind !== undefined && fieldFromSchemaTree.data[propertyName].kind === "ListType") {
                                continue;
                            }
                            else {
                                let uri = schemaMapping["@context"][propertyName];
                                if (uri === undefined) {
                                    throw new GraphQLError({ key: 'ERROR', message: `Uri for ${propertyNameField} is not defined in context` });
                                }
                                let search = database.getObjectsValueArray((objectID), (uri));
                                if (search.length > 0) {
                                    throw new GraphQLError({ key: 'ERROR', message: `Can not override field: ${propertyNameField}. The field is already defined in object` });
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
                        throw new GraphQLError({ key: 'ERROR', message: `Uri for ${propertyNameField} is not defined in context` });
                    }

                    //let objectFromInput = req.input[propertyName];
                    // console.log(req.input[propertyName])
                    let objectsFromInput = req.input[propertyName];
                    if (!isIterable(req.input[propertyName])) {
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
                                //database.selectedOperation((objectID), (uri), (objectFromInput['_id']));
                            }
                            else if (returnType.type === "UnionType") {
                                // console.log("UNION TYPE")
                                if (objectFromInput['_id'] !== undefined && objectFromInput['_value'] !== undefined) {
                                    throw new GraphQLError({ key: `Defined all three properties for ${propertyName} type object.`, message: 'Select only one property.' });
                                }

                                uriFromInput = uri;
                                uri = tree[fieldFromSchemaTree.data[propertyName].data.name].values;
                                uri = uri.map(x => schemaMapping["@context"][x]);

                                //let type = schemaMapping["@graph"].filter(x => x['@id'] === schemaMapping["@context"][objectFromInput['_type']])[0]['@type']; // scary !

                                if (objectFromInput['_value'] !== undefined) {
                                    let objForQuery = factory.literal(objectFromInput['_value']);
                                    objForQuery.datatype = factory.namedNode(schemaMapping["@context"][objectFromInput['_type']]);
                                    //database.selectedOperation((objectID), (uriFromInput), objForQuery);
                                }
                                else {
                                    //database.selectedOperation((objectID), (uriFromInput), (objectFromInput['_id']));
                                }

                            }
                            else if (returnType.type === "http://schema.org/DataType") {

                                // console.log("CREATE DATA TYPE CON")
                                // console.log(objectID)
                                // console.log(uri)


                                let objForQuery = factory.literal(objectFromInput['_value']);
                                objForQuery.datatype = { value: schemaMapping["@context"][objectFromInput['_type']] }
                                // objForQuery.datatype = factory.namedNode("http://schema.org/" + objectFromInput['_type']);
                                // // console.log(objForQuery)
                                // console.log("END")
                                //database.selectedOperation((objectID), (uri), objForQuery);
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


            //console.log(JSON.stringify( req.input))
            let dataForQuads = req.input;
            dataForQuads["@context"] = schemaMapping["@context"];
            //console.log( JSON.stringify(dataForQuads))

            const rdf = await jsonld.toRDF(dataForQuads, { format: 'application/n-quads' });

            req.type === "REMOVE" ? database.removeRDF(rdf, objectID) : database.insertRDF(rdf, objectID);

            //console.log(rdf);
            setTimeout(() => console.log(database.getAllQuads()), 1);


            return true;
        };
    }

    newResolverBody['DELETE'] = (args, req) => {
        const objectID = req.id;
        if (!database.isTripleInDB(objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing")) {
            throw new GraphQLError({ key: 'ERROR', message: 'The object must exist in the database prior to this request.' });
        }
        return database.deleteID((objectID));
    }
    newResolverBody['CREATE'] = (args, req) => {
        const objectID = req.id;
        if (database.isTripleInDB(objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing")) {
            throw new GraphQLError({ key: 'ERROR', message: 'The object cannot exist in the database prior to this request.' });
        }
        return database.create(objectID, "http://staple-api.org/datamodel/type", "http://schema.org/Thing");
    }

    return newResolverBody;
}


module.exports = createMutationResolvers