const schemaString = require('../schema/schema');
const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaMapping = require('../schema/schema-mapping');
const factory = require('@graphy/core.data.factory');

createQueryResolvers = (database, tree) => {
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
            // console.log(schemaTree[object])

            let newResolver = tree[object].name
            let newResolverBody = {}

            for (var propertyName in tree[object].data) {
                if (propertyName === '_value') {
                    newResolverBody['_value'] = async (parent) => { return parent.value } // OK
                }
                else if (propertyName === '_type') {
                    newResolverBody['_type'] = (parent) => { return [parent.datatype.value] } // OK
                }
            }

            queryResolverBody['Data'][newResolver] = newResolverBody;

        } else if (tree[object].type === "http://www.w3.org/2000/01/rdf-schema#Class") {
            // Core Query
            let uri = tree[object]['uri'];
            let constr = (uri) => { return (parent) => {return database.getSubs(uri) } }; // OK
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
                    newResolverBody['_id'] =  (parent) => {  return  parent }; // OK
                }
                else if (propertyName === '_type') {
                    newResolverBody['_type'] =  (parent) => { return  database.getObjs(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") }; // OK
                }
                else {
                    let uri = schemaMapping["@context"][propertyName];
                        if (uri === undefined) {
                            uri = "http://schema.org/" + propertyName;
                        }
                    if (isItList) {
                        const name = uri; //currentObject['uri'];
                        let constr = (name) => { return (parent) => { return database.getObjsforResolver(parent, name) } }; // OK
                        newResolverBody[propertyName] = constr(name);
                    }
                    else {
                        const name = uri; //currentObject['uri'];
                        let constr = (name) => { return ((parent) => { return database.getSingleLiteral(parent, name) }) };// OK
                        newResolverBody[propertyName] = constr(name);
                    }
                }

            }

            queryResolverBody['Objects'][newResolver] = newResolverBody;
        }
    }
    return queryResolverBody;
}


module.exports = createQueryResolvers