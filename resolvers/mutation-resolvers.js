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
            const objectID = req.input['_id'];
            if (objectID === undefined) {
                return false;
            }

            let fieldName = mutation.fields[field].name.value;
            let fieldFromSchema = objectsFromSchemaMapping.filter(x => x.name === fieldName);
            // console.log(fieldFromSchema)
            fieldFromSchema = fieldFromSchema[0];

            if (req.type === "CREATE") {
                if (database.getTriplesBySubject(objectID).length > 0) {
                    return false;
                }
                
                for (let propertyName in fieldFromSchema.data) {
                    if (propertyName === '_id') {
                        continue;
                    }
                    else if (propertyName === '_type') {
                        database.create(factory.namedNode(objectID), factory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), factory.namedNode(fieldFromSchema.uri));
                    }
                    else {
                        let uri = fieldFromSchema.data[propertyName].uri;
                        if(uri === undefined){
                            uri = fieldFromSchema.data[propertyName].data.uri;
                        }
                         
                        let objectFromInput = req.input[propertyName];
                        //add triple
                        if (objectFromInput !== undefined) {
                            for( let temp in objectFromInput){
                                objectFromInput = objectFromInput[temp];
                            }
                            
                            if (objectFromInput['_value'] === undefined) {
                                database.create(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(objectFromInput['_id'])); // uri jest zle
                            }
                            else {
                                let objForQuery = factory.literal(objectFromInput['_value']);
                                objForQuery.datatype = factory.namedNode("http://schema.org/" + objectFromInput['_type']);
                                database.create(factory.namedNode(objectID), factory.namedNode(uri), objForQuery);
                            }
                        }
                    }
                }
                const asada = database.getTriplesBySubject("http://www.id.org");
                console.log("\n\n")
                console.log(asada)
                return true;
            }
            else if (req.type === "UPDATE") {
                for (let propertyName in fieldFromSchema.data) {
                    if (fieldFromSchema.data[propertyName].name !== '_id' && fieldFromSchema.data[propertyName].name !== '_type') {
                        let uri = fieldFromSchema.data[propertyName].uri;
                        let objectFromInput = req.input[fieldFromSchema.data[propertyName].name];

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
                for (let propertyName in fieldFromSchema.data) {
                    const currentField = fieldFromSchema.data[propertyName];
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

                for (let propertyName in fieldFromSchema.data) {
                    if (fieldFromSchema.data[propertyName].name !== '_id' && fieldFromSchema.data[propertyName].name !== '_type') {
                        let uri = fieldFromSchema.data[propertyName].uri;
                        let objectFromInput = req.input[fieldFromSchema.data[propertyName].name];

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
                for (let propertyName in fieldFromSchema.data) {
                    if (fieldFromSchema.data[propertyName].name !== '_id' && fieldFromSchema.data[propertyName].name !== '_type') {
                        let uri = fieldFromSchema.data[propertyName].uri;
                        console.log("\n");
                        if(uri === undefined ){
                            uri = fieldFromSchema.data[propertyName].data.uri;
                        }

                        if(uri === "@id"){
                            //console.log(fieldFromSchema.data);
                        }
                        let objectFromInput = req.input[fieldFromSchema.data[propertyName].name];
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