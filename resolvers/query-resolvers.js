const schemaString = require('../schema/schema');
const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaMapping = require('../schema/schema-mapping');
const factory = require('@graphy/core.data.factory');

createQueryResolvers = (database, schemaTree) => {
    // -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE

    let queryResolverBody = {};
    queryResolverBody['Query'] = {};
    queryResolverBody['Data'] = {};

    // console.log(schemaTree)
    // console.dir(schemaTree);


    // -------------------------------------------------- CREATE RESOLVERS
    let objectsFromSchemaTree = [];
    for (var property in schemaTree) { objectsFromSchemaTree.push(schemaTree[property]); };
    // console.log(objectsFromSchemaTree)

    for (var object in schemaTree) {
        // console.log("\nNEW OBJECT\n")
        // console.log(object)
        // const schemaForObject = schema.getTypeMap()[object['name']];
        // console.log(schemaForObject.astNode.fields.map(x => x['name']['value']))
        // console.log(schemaTree[object].type)

        if (schemaTree[object].type === 'DataType') {
            // TYPE
            // console.log(schemaTree[object])

            let newResolver = schemaTree[object].name
            let newResolverBody = {}

            for (var property in schemaTree[object].data) {
                // console.log(property )
                if (property === '_value') {
                    newResolverBody['_value'] = async (parent) => { return parent.value }
                }
                else if (property === '_type') {
                    newResolverBody['_type'] = (parent) => { return [parent.datatype.value] }
                }
            }

            queryResolverBody['Data'][newResolver] = newResolverBody;

        } else if (schemaTree[object].type === 'ObjectType') {
            //OBJECT
            // console.log(schemaTree[object])
            if(schemaTree[object].name === "_Prov"){
                continue;
            }
            let newResolver = schemaTree[object].name
            let newResolverBody = {}


            for (var property in schemaTree[object].data) {
                let currentObject = schemaTree[object].data[property];
                let isItList = false;

                if (currentObject.kind == 'ListType') {
                    currentObject = currentObject.data;
                    isItList = true;
                }

                if (property === '_id') {
                    newResolverBody['_id'] = async (parent) => { return await parent };
                }
                else if (property === '_type') {
                    newResolverBody['_type'] = async (parent) => { return await database.getObjs(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") };
                }
                else {
                    if (isItList) {
                        const name = currentObject['uri'];
                        let constr = (name) => { return (parent) => { return database.getObjs(parent, name) } };
                        newResolverBody[property] = constr(name);
                    }
                    else {
                        const name = "http://schema.org/" + property;
                        let constr = (name) => { return ((parent) => { return database.getSingleLiteral(parent, name) }) };
                        newResolverBody[property] = constr(name);
                    }
                }

            }

            queryResolverBody['Query'][newResolver] = newResolverBody;
        }
    }
    return queryResolverBody;
}


module.exports = createQueryResolvers