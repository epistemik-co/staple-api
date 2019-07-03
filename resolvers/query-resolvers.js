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
    for (var property in tree) { objectsFromSchemaObjectTree.push(tree[property]); };
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

            for (var property in tree[object].data) {
                if (property === '_value') {
                    newResolverBody['_value'] = async (parent) => {console.log(parent); return parent.value }
                }
                else if (property === '_type') {
                    newResolverBody['_type'] = (parent) => { console.log(parent); return [parent.datatype.value] }
                }
            }

            queryResolverBody['Data'][newResolver] = newResolverBody;

        } else if (tree[object].type === "http://www.w3.org/2000/01/rdf-schema#Class") {
            // Core Query
            let uri = tree[object]['uri'];
            let constr = (uri) => { return (parent) => {console.log(uri); return database.getSubs(uri) } };
            queryResolverBody['Query'][tree[object].name] = constr(uri);
            
            //OBJECT
            // console.log(tree[object])
            let newResolver = tree[object].name
            let newResolverBody = {}


            for (var property in tree[object].data) {
                let currentObject = tree[object].data[property];
                let isItList = false;

                if (currentObject.kind == 'ListType') {
                    currentObject = currentObject.data;
                    isItList = true;
                }

                if (property === '_id') {
                    newResolverBody['_id'] =  (parent) => { console.log(parent); return  parent };
                }
                else if (property === '_type') {
                    newResolverBody['_type'] =  (parent) => {console.log(parent); return  database.getObjs(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") };
                }
                else {
                    if (isItList) {
                        const name = currentObject['uri'];
                        let constr = (name) => { return (parent) => {console.log(parent); return database.getObjs(parent, name) } };
                        newResolverBody[property] = constr(name);
                    }
                    else {
                        const name = currentObject['uri'];
                        let constr = (name) => { return ((parent) => {console.log(parent); return database.getSingleLiteral(parent, name) }) };
                        newResolverBody[property] = constr(name);
                    }
                }

            }

            queryResolverBody['Objects'][newResolver] = newResolverBody;
        }
    }
    return queryResolverBody;
}


module.exports = createQueryResolvers