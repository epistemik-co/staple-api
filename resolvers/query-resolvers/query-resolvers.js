let schemaMapping = undefined; // require('../../schema/schema-mapping');
const qpl = require("graphql-tag")
const util = require('util')
var appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/winston`);

handleDataTypeResolver = (tree, object) => {
    let newResolverBody = {}


    for (var propertyName in tree[object].data) {
        if (propertyName === '_value') {
            newResolverBody['_value'] = async (parent) => { if(parent.value === undefined) return parent; return parent.value }
        }
        else if (propertyName === '_type') {
            newResolverBody['_type'] = (parent) => {

                let types = ["http://schema.org/Text"];
                if(parent.datatype !== undefined){
                    types = [parent.datatype.value]
                }

                types = types.map(x => {
                    for (let key in schemaMapping['@context']) {
                        if (schemaMapping['@context'][key] === x)
                            return key;
                    }
                    return ""
                })

                return types;
            }
        }
    }

    return newResolverBody;
}
handleClassTypeResolver = (tree, object, database) => {
    let newResolverBody = {}

    for (var propertyName in tree[object].data) {
        let currentObject = tree[object].data[propertyName];
        let isItList = false;

        if (currentObject.kind == 'ListType') {
            currentObject = currentObject.data;
            isItList = true;
        }

        if (propertyName === '_id') {
            newResolverBody['_id'] = (parent) => { return parent };
        }
        else if (propertyName === '_type') {
            newResolverBody['_type'] = async (parent, args) => {
                if (args.inferred) {
                    return await database.getObjectsValueArray((parent), database.stampleDataType)
                }
                let types = await database.getObjectsValueArray((parent), ("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"))

                types = types.map(x => {
                    for (let key in schemaMapping['@context']) {
                        if (schemaMapping['@context'][key] === x)
                            return key;
                    }
                    return ""
                })

                return types
            };
        }
        else {
            let uri = schemaMapping["@context"][propertyName];
            if (uri === undefined) {
                // throw new GraphQLError({ key: `Uri not found`, message: 'URI for: {propertyName} was not found' });
                uri = "http://schema.org/" + propertyName;
            }

            if (tree[currentObject.name].type === "UnionType") {
                const name = uri;
                let constr = (name) => {
                    return async (parent) => {
                        let data = await database.getObjectsValueArray((parent), (name));
                        return data;
                    }
                };
                newResolverBody[propertyName] = constr(name);

            }
            else {
                const name = uri;
                let type = currentObject.name;

                let constr = (name, isItList, type, objectType) => {
                    return (async (parent, args) => {
                        if (name === "@reverse") {
                            let data = database.getTriplesByObjectUri(parent);
                            return data;
                        }

                        if (parent.value) {
                            parent = parent.value;
                        }

                        if (isItList) {
                            if (objectType === "http://schema.org/DataType") {
                                let data = await database.getObjectsValueArray((parent), (name), true);
                                return data
                            }
                            else {
                                return await database.getObjectsValueArray((parent), (name), false);
                            }
                        }
                        else {
                            return database.getSingleLiteral((parent), (name));
                        }
                    })
                };
                newResolverBody[propertyName] = constr(name, isItList, type, tree[currentObject.name].type);
            }
        }
    }
    return newResolverBody;
}
handleUnionTypeResolver = (tree, object, database) => {
    let newResolverBody = {}

    let constr = (name) => {
        return async (parent, args, context, info) => {
            

            let typesOfObject = tree[name].values.map(value => {
                let uriToName = {};
                uriToName[schemaMapping["@context"][value]] = value;

                return uriToName;
            })

            
            let typeOfInspectedObject = await database.getObjectsValueArray(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
            typeOfInspectedObject = typeOfInspectedObject[0];


            let searchedTypes = typesOfObject.filter(x => x[typeOfInspectedObject] !== undefined)[0];

            // Could not find exact type
            if (searchedTypes === undefined) {
                //look for infered types
                let inferedTypes = [];
                let data = schemaMapping["@graph"].filter((x) => { return x['@id'] === typeOfInspectedObject });
                for (let key in data) {
                    let uris = data[key]["http://www.w3.org/2000/01/rdf-schema#subClassOf"];
                    for (let x in uris) {
                        inferedTypes.push(uris[x]['@id']);
                    }

                }

                for (let key in inferedTypes) {
                    for (let i in typesOfObject) {
                        for (key2 in typesOfObject[i]) {
                            if (key2 === inferedTypes[key]) {
                                return typesOfObject[i][key2]
                            }
                        }
                    }
                }
            }
            typesOfObject = typesOfObject.filter(x => x[typeOfInspectedObject] !== undefined)[0];
            if(typesOfObject === undefined){
                let possibleTypes = name.split('_')
                if(possibleTypes.includes('Text')){
                    return "Text"
                }
                return possibleTypes[0];
            }
            return typesOfObject[typeOfInspectedObject];
        };

    };

    newResolverBody['__resolveType'] = constr(object)
    return newResolverBody
}
handleReverseDataTypeResolver = (tree, object) => {
    let newResolverBody = {}

    for (var propertyName in tree[object].data) {
        let uri = tree[object].data[propertyName].data.uri;

        let constr = (name) => {
            return ((parent, args) => {
                parent = parent.filter(x => x.predicate.value === name);
                let data = parent.map(x => x.subject.value);
                return data;
            })
        };

        newResolverBody[propertyName] = constr(uri);
    }
    return newResolverBody;
}

createQueryResolvers = (database, tree, Warnings, schemaMappingArg) => {
    // -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE
    schemaMapping = schemaMappingArg;
    let queryResolverBody = {};
    queryResolverBody['Query'] = {};
    queryResolverBody['Objects'] = {};
    queryResolverBody['Data'] = {};

    // -------------------------------------------------- CREATE RESOLVERS
    let objectsFromSchemaObjectTree = [];
    for (var propertyName in tree) { objectsFromSchemaObjectTree.push(tree[propertyName]); };

    for (var object in tree) {

        if (tree[object].type === "http://schema.org/DataType") {
            let newResolver = tree[object].name;
            queryResolverBody['Data'][newResolver] = handleDataTypeResolver(tree, object)
        }
        else if (tree[object].type === "http://www.w3.org/2000/01/rdf-schema#Class") {
            // Core Query
            let uri = tree[object]['uri'];
            let constr = (uri) => {
                return async (parent, args, context, info) => {
                    logger.debug(util.inspect(info['operation'], false, null, true /* enable colors */))
                    logger.info(`Query started for ${uri}`)
                    let data = await database.loadQueryData(info['operation'], uri, args.page, args.inferred, tree);
                    logger.info(
                        `Finall db calls : ${database.dbCallCounter}
                        \tQuads in graphy : ${database.database.size}
                        \tObjects in graphy : ${database.countObjects()}`)
                    data = database.pages[args.page];
                    return data;
                }
            };
            queryResolverBody['Query'][tree[object].name] = constr(uri);

            //OBJECT
            let newResolver = tree[object].name;
            queryResolverBody['Objects'][newResolver] = handleClassTypeResolver(tree, object, database);
        }
        else if (tree[object].type === "UnionType") {
            let newResolver = tree[object].name;
            queryResolverBody['Data'][newResolver] = handleUnionTypeResolver(tree, object, database);
        }
        else if (tree[object].type === "EnumType") {
            //....

        }
        else if (tree[object].type === "Reverse") {
            let newResolver = tree[object].name;
            queryResolverBody['Data'][newResolver] = handleReverseDataTypeResolver(tree, object);
        }
        else if (object === "_CONTEXT") {
            queryResolverBody["Query"]["_CONTEXT"] = () => { return schemaMapping["@context"] }
        }
        else if (object === "_OBJECT") {
            queryResolverBody["Query"]["_OBJECT"] = async (obj, args, context, info) => {
                logger.debug(util.inspect(info['operation'], false, null, true /* enable colors */))
                let data = await database.loadQueryData(info['operation'], "http://schema.org/Thing", args.page, args.inferred, tree)
                data = database.pages[args.page];
                data = data.map(async (id) => { return { '_id': id, '_type': await database.getObjectsValueArray(id, database.stampleDataType) } });
                return data;
            }
        }
        else {
            logger.warn("UNHANDLED TYPE")
            logger.warn(object)
            logger.warn(tree[object].type)
        }
    }
    return queryResolverBody;
}


module.exports = createQueryResolvers