const { GraphQLError } = require('graphql');
const dataset_tree = require('graphy').util.dataset.tree
const { ApolloError } = require('apollo-server-express');



const validateIsIterable = (obj) => {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

const validateURI = (uri, name) => {
    if (uri === undefined) {
        throw new GraphQLError({ key: 'ERROR', message: `Uri for ${name} is not defined in context` });
    }
    if (uri === "@reverse") {
        return;
    }
    var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if (!pattern.test(uri)) {
        // throw new ApolloError("message", "code", "code");
        console.log(uri)
        throw new GraphQLError({ key: 'ERROR', message: `The value of ${name} keys in the object are valid URIs` });
    }
}

const validateflattenedJson = (data) => {
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

const validateIsObjectInDatabase = (database, sub, pred, obj, expect = false, ensureExists = true) => {
    if (database.isTripleInDB(sub, pred, obj) === expect) {
        if (ensureExists) {
            throw new GraphQLError({ key: 'ERROR', message: 'The object must exist in the database prior to this request.' });
        }
    }
}

const validateIsIdDefined = (id) => {
    if (id === undefined) {
        throw new GraphQLError({ key: 'ERROR', message: 'The ID must be defined.' });
    }
}

const validateData = async (database, objectID, rdf, ensureExists, reqType, Warnings) => {
    let dataForValidation = dataset_tree();

    await database.insertRDF(dataForValidation, objectID, rdf);

    let temp = dataForValidation.match(null, null, null);
    let data = {};
    var itr = temp.quads();
    var x = itr.next();
    let RemovedType = {};
    while (!x.done) {
        data = x.value;
        // uri validation
        validateURI(data.subject.value, data.subject.value)
        validateURI(data.predicate.value, data.predicate.value)
        if (data.object.datatype === undefined) {
            validateURI(data.object.value, data.object.value)
        }
        else {
            validateURI(data.object.datatype.value, data.object.datatype.value)
        }

        // ensureExists
        if (ensureExists) {
            if (data.object.datatype === undefined) {
                if (data.predicate.value !== database.stampleDataType && data.predicate.value !== "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    let uri = data.object.value;
                    validateIsObjectInDatabase(database, uri, "http://staple-api.org/datamodel/type", "http://schema.org/Thing", false);
                }
            }
        }
        else {
            if (data.object.datatype === undefined) {
                if (data.predicate.value !== database.stampleDataType && data.predicate.value !== "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    let uri = data.object.value;
                    if (database.isTripleInDB(uri, "http://staple-api.org/datamodel/type", "http://schema.org/Thing") === false) {
                        database.create(uri, "http://staple-api.org/datamodel/type", "http://schema.org/Thing")
                    }
                }
            }
        }

        if (reqType === "REMOVE" && data.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
            if (RemovedType[data.subject.value] === undefined) {
                RemovedType[data.subject.value] = [];
            }
            RemovedType[data.subject.value].push(data.object.value);
        }

        x = itr.next();
    }

    for (let key in RemovedType) {
        let types = database.getObjectsValueArray(key, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
        if (types.every(elem => RemovedType[key].indexOf(elem) > -1)) {
            Warnings.push({ 'Message': `Object with id: ${key} has no type` })
        }
    }
}

const validateUnion = (fieldFromSchemaTree, schemaMapping, req, objectsFromSchemaObjectTree) => {
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
}

module.exports = {
    validateIsIterable: validateIsIterable,
    validateURI: validateURI,
    validateflattenedJson: validateflattenedJson,
    validateIsObjectInDatabase: validateIsObjectInDatabase,
    validateIsIdDefined: validateIsIdDefined,
    validateData: validateData,
    validateUnion: validateUnion
};