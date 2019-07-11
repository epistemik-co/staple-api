const schemaMapping = require('../../schema/schema-mapping');

createQueryResolvers = (database, tree, Warnings) => {
    // -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE

    let queryResolverBody = {};
    queryResolverBody['Query'] = {};
    queryResolverBody['Objects'] = {};
    queryResolverBody['Data'] = {};

    // console.log(schemaTree)
    // console.dir(schemaTree);


    // -------------------------------------------------- CREATE RESOLVERS
    let objectsFromSchemaObjectTree = [];
    for (var propertyName in tree) { objectsFromSchemaObjectTree.push(tree[propertyName]); };
    // console.log(objectsFromSchemaTree)

    for (var object in tree) {
        // console.log("\nNEW OBJECT\n")
        // console.log(object)
        // const schemaForObject = schema.getTypeMap()[object['name']];
        // console.log(schemaForObject.astNode.fields.map(x => x['name']['value']))
        // console.log(schemaTree[object].type)

        if (tree[object].type === "http://schema.org/DataType") {
            // TYPE
            let newResolver = tree[object].name
            let newResolverBody = {}

            for (var propertyName in tree[object].data) {
                if (propertyName === '_value') {
                    newResolverBody['_value'] = async (parent) => { return parent.value }
                }
                else if (propertyName === '_type') {
                    newResolverBody['_type'] = (parent) => { return [parent.datatype.value] }
                }
            }

            queryResolverBody['Data'][newResolver] = newResolverBody;

        } 
        else if (tree[object].type === "http://www.w3.org/2000/01/rdf-schema#Class") {

            // Core Query
            let uri = tree[object]['uri'];
            let constr = (uri) => {
                return (parent, args) => {
                    let data = database.getSubjectsByType((uri), "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", args.inferred);
                    data = data.filter((id, index) => { return index >= (args.page - 1) * 10 && index < args.page * 10 })
                    return data
                }
            };
            queryResolverBody['Query'][tree[object].name] = constr(uri);

            //OBJECT
            // console.log(tree[object])
            let newResolver = tree[object].name
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
                    newResolverBody['_type'] = (parent, args) => {
                        if (args.inferred) {
                            return database.getObjectsValueArray((parent), database.stampleDataType)
                        }
                        return database.getObjectsValueArray((parent), ("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"))
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
                            return (parent) => {
                                let data = database.getObjectsValueArray((parent), (name));
                                return data;
                            }
                        };
                        newResolverBody[propertyName] = constr(name);

                    }
                    else {
                        const name = uri;
                        let constr = (name, isItList) => {
                            return ((parent) => {
                                if (parent.value) {
                                    parent = parent.value;
                                }
                                if (isItList) {
                                    return database.getObjectsValueArray((parent), (name));
                                }
                                else {
                                    return database.getSingleLiteral((parent), (name));
                                }
                            })
                        };
                        newResolverBody[propertyName] = constr(name, isItList);
                    }
                }
            }
            queryResolverBody['Objects'][newResolver] = newResolverBody;
        }
        else if (tree[object].type === "UnionType") {
            let newResolver = tree[object].name
            let newResolverBody = {}

            let constr = (name) => {
                return (parent) => {
                    let typesOfObject = tree[name].values.map(value => {
                        let uriToName = {};
                        uriToName[schemaMapping["@context"][value]] = value;
                        return uriToName;
                    })

                    const typeOfObject = database.getObjectsValueArray(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type")[0];
                    typesOfObject = typesOfObject.filter(x => x[typeOfObject] !== undefined)[0]
                    return typesOfObject[typeOfObject];
                };

            };

            newResolverBody['__resolveType'] = constr(object)

            queryResolverBody['Data'][newResolver] = newResolverBody;
        }
        else if (tree[object].type === "EnumType") {
        }
        else if (tree[object].type === "REV") {
            let newResolver = tree[object].name
            let newResolverBody = {}
            let constr = (name) => {
                return (parent) => {
                    return parent;
                };
            };

            newResolverBody['__resolveType'] = constr(object)

            queryResolverBody['Data'][newResolver] = newResolverBody;
        }
        else if (object === "_CONTEXT") {
            queryResolverBody["Query"]["_CONTEXT"] = () => { return [schemaMapping["@context"]] }
        }
        else if (object === "_OBJECT") {
            queryResolverBody["Query"]["_OBJECT"] = (obj, args, context, info) => {
                let data = database.getSubjectsByType("http://schema.org/Thing", database.stampleDataType, args.inferred);
                data = data.filter((id, index) => { return index >= (args.page - 1) * 10 && index < args.page * 10 });
                data = data.map((id) => { return { '_id': id, '_type': database.getObjectsValueArray(id, database.stampleDataType) } });
                return data;
            }
        }
        else {
            console.log("UNHANDLED TYPE")
            console.log(object)
            console.log(tree[object].type)
        }
    }
    //console.log(queryResolverBody);
    return queryResolverBody;
}


module.exports = createQueryResolvers