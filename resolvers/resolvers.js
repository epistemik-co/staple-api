const createTree = require('../schema/schema-tree');
const createMutationResolvers = require('./mutation-resolvers');
const createQueryResolvers = require('./query-resolvers');
const schemaString = require('../schema/schema');
const schemaMapping = require('../schema/schema-mapping');
const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const factory = require('@graphy/core.data.factory');

class rootResolver {
    constructor(db) {
        this.database = db;
        // console.log(schema.getTypeMap()["Person"]);

        this.rootResolver = {
            // Query: {
            //     // Person_GET: () => {
            //     //     return this.database.getSubs("http://schema.org/Person");
            //     // },
            //     // Organization_GET: () => {
            //     //     return this.database.getSubs("http://schema.org/Organization");
            //     // },
            //     // Mutation: {

            //     //     Organization_UPSERT(input: Organization_INPUT): Boolean
            //     //     Organization_DELETE(input: Organization_INPUT): Boolean
            //     //     Person_UPSERT(input: Person_INPUT): Boolean
            //     //     Person_DELETE(input: Person_INPUT): Boolean
            //     // }

            // }
        }

        this.tree = createTree();

        // -------------------------------------------------- Create Query resolvers
        
        // const queryResolvers = createQueryResolvers(this.database, this.tree);
        // this.rootResolver['Query'] = queryResolvers["Query"];
        // for (const [key, value] of Object.entries(queryResolvers['Data'])) {
        //     this.rootResolver[key] = queryResolvers['Data'][key];
        // }
        //const mutationResolvers = createMutationResolvers(this.database, this.tree);
        //this.rootResolver['Mutation'] = mutationResolvers;
        // console.log(this.rootResolver)

    }

    // Mutation resolvers are based on schemaTree
    createMutationResolvers() {
        // console.log("createMutationResolvers");
        const schema = buildSchemaFromTypeDefinitions(schemaString);

        let objectsFromSchemaMapping = [];
        for (var property in schemaMapping.types) { objectsFromSchemaMapping.push(schemaMapping.types[property]); };

        // console.log(schemaMapping)
        // console.log(schema)

        // ADD ROOT MUTATION
        let newResolver = "Mutation";
        let newResolverBody = {};

        // find mutation 
        const mutation = schema.getTypeMap()['Mutation'].astNode;
        for (let field in mutation.fields) {
            // console.log(mutation.fields[field].name.value);

            newResolverBody[mutation.fields[field].name.value] = async (args, req) => {
                // assign fields 
                // console.dir(req.input)

                // Object ID
                const objectID = req.input['_id'];
                if(objectID === undefined){
                    return false;
                }

                // console.log(objectID)

                // UPSERT or DELETE
                if (mutation.fields[field].name.value.indexOf("_UPSERT") > -1) {
                    // console.log("_UPSERT")

                    // objectID -> predicate -> object
                    // find field in schema-mapping and assign predicate = uri;
                    // object = req.input[xxx]....
                    let fieldName = mutation.fields[field].name.value.split("_UPSERT")[0];

                    let fieldFromMapping = objectsFromSchemaMapping.filter(x => x.name === fieldName);
                    fieldFromMapping = fieldFromMapping[0];

                    // console.log(fieldFromMapping.fields)

                    // add Id and Type
                    for (let fieldNumber in fieldFromMapping.fields) {
                        if (fieldFromMapping.fields[fieldNumber].name === '_id') {
                            continue;
                        }
                        else if (fieldFromMapping.fields[fieldNumber].name === '_type') {
                            this.database.create(factory.namedNode(objectID), factory.namedNode(fieldFromMapping.fields[fieldNumber].uri), factory.namedNode(fieldFromMapping.uri));
                        }
                        else {
                            let uri = fieldFromMapping.fields[fieldNumber].uri;
                            let objectFromInput = req.input[fieldFromMapping.fields[fieldNumber].name];
                            //add triple
                            if (objectFromInput !== undefined) {
                                if (objectFromInput['_value'] === undefined) {
                                    this.database.create(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(objectFromInput['_id']));
                                }
                                else {
                                    let objForQuery = factory.literal(objectFromInput['_value']);
                                    objForQuery.datatype = factory.namedNode("http://schema.org/Text");
                                    this.database.create(factory.namedNode(objectID), factory.namedNode(uri), objForQuery);
                                }
                            }
                            else{
                                this.database.create(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(null));
                            }
                        }
                    }

                    return true;
                }
                else if (mutation.fields[field].name.value.indexOf("_DELETE") > -1) {
                    // console.log("_DELETE")

                    // objectID -> predicate -> object
                    // find field in schema-mapping and assign predicate = uri;
                    // object = req.input[xxx]....
                    let fieldName = mutation.fields[field].name.value.split("_DELETE")[0];

                    let fieldFromMapping = objectsFromSchemaMapping.filter(x => x.name === fieldName);
                    fieldFromMapping = fieldFromMapping[0];

                    // console.log(fieldFromMapping.fields)

                    for (let fieldNumber in fieldFromMapping.fields) {
                        if (fieldFromMapping.fields[fieldNumber].name === '_id') {
                            continue;
                        }
                        else if (fieldFromMapping.fields[fieldNumber].name === '_type') {
                            // if id is only value
                            if(Object.keys(req.input).length === 1 ){
                                // this.database.delete(factory.namedNode(objectID), factory.namedNode(fieldFromMapping.fields[fieldNumber].uri), factory.namedNode(fieldFromMapping.uri));
                                // remove all
                                this.database.deleteID(objectID);
                            }
                            else{
                                continue;
                            }
                        }
                        else {
                            let uri = fieldFromMapping.fields[fieldNumber].uri;
                            let objectFromInput = req.input[fieldFromMapping.fields[fieldNumber].name];
                            //add triple
                            if (objectFromInput !== undefined) {
                                if (objectFromInput['_value'] === undefined) {
                                    this.database.delete(factory.namedNode(objectID), factory.namedNode(uri), factory.namedNode(objectFromInput['_id']));
                                }
                                else {
                                    let objForQuery = factory.literal(objectFromInput['_value']);
                                    objForQuery.datatype = factory.namedNode("http://schema.org/Text");
                                    this.database.delete(factory.namedNode(objectID), factory.namedNode(uri), objForQuery);
                                }
                            }
                            else{
                                continue;
                            }
                        }
                    }

                    // remove triple to database
                    // this.database.create("e","b","c");
                    // this.database.create("a","b","c");
                    // this.database.create("a","b","d");
                    // this.database.delete("a");
                    return true;
                }

                // // Is Property an object ?  
                // for(let prop in req.input){
                //     let typeOfField = typeof( req.input[prop]) 
                //     if(typeOfField === 'object'){
                //         // console.log("Need to dig deeper");
                //     }
                //     else {
                //         // console.log("Just add it");
                //     }
                // }

                // console.log(await this.database.getTriplesBySubject(objectID));

                return false;
            };
        }

        // Fill Body
        // newResolverBody['_id'] = (parent) => { return parent }

        this.rootResolver[newResolver] = newResolverBody;

    }

    // Query resolvers are based on schemaTree
    createQueryResolvers() {
        // -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE

        const schemaTree = createTree();

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

                this.rootResolver[newResolver] = newResolverBody;

            } else if (schemaTree[object].type === 'ObjectType') {
                //OBJECT
                // console.log(schemaTree[object])

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
                        newResolverBody['_type'] = async (parent) => { return await this.database.getObjs(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") };
                    }
                    else {
                        if (isItList) {
                            const name = currentObject['uri'];
                            let constr = (name) => { return (parent) => { return this.database.getObjs(parent, name) } };
                            newResolverBody[property] = constr(name);
                        }
                        else {
                            const name = "http://schema.org/" + property;
                            let constr = (name) => { return ((parent) => { return this.database.getSingleLiteral(parent, name) }) };
                            newResolverBody[property] = constr(name);
                        }
                    }

                }

                this.rootResolver[newResolver] = newResolverBody;
            }
        }
    }
}

module.exports = rootResolver