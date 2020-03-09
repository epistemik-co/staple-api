
const logger = require("../../../config/winston");


let handleClassTypeResolver = (tree, object, database, schemaMapping) => {
    let newResolverBody = {};

    for (var propertyName in tree[object].data) {
        let currentObject = tree[object].data[propertyName];

        if (propertyName === "_id") {
            newResolverBody["_id"] = (parent) => { return parent; };
        }
        else if (propertyName === "_type") {
            newResolverBody["_type"] = typeResolver(database, schemaMapping);
        }
        else {
            let uri = schemaMapping["@context"][propertyName];
            if (uri === undefined) {
                logger.warn(`Uri not found for: ${propertyName} in schema mapping`);
                uri = "http://schema.org/" + propertyName;
            }
            newResolverBody[propertyName] = dataResolver(database, uri, currentObject["ListType"]);
        }
    }
    return newResolverBody;
};

const dataResolver = (database, name, isItList) => {
    return (async (parent) => {
        if (parent.value) {
            logger.warn("Parent should already contain value");
            parent = parent.value;
        }

        if (isItList) {
            return await database.getObjectsValueArray((parent), (name));
        }
        else {
            let value = database.getSingleLiteral((parent), (name));
            if(value === null){
                return value;
            }
            if(value.datatype && value.datatype.value === "http://www.w3.org/2001/XMLSchema#boolean"){
                let isTrueSet = (value.value == "true");
                return isTrueSet;
            }
            return value.value;
        }
    });
};

const typeResolver = (database, schemaMapping) => {
    return async (parent, args) => {
        let types = await database.getObjectsValueArray((parent), ("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"));
        if (args.inferred) {
            types = await database.getObjectsValueArray((parent), database.stapleDataType);
        }
        
        types = types.map(x => {
            for (let key in schemaMapping["@context"]) {
                if (schemaMapping["@context"][key] === x)
                    return key;
            }
            return "";
        });
        return types;
    };
};

module.exports = handleClassTypeResolver;