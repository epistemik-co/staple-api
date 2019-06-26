const createTree = require('./schemaTree')

class rootResolver {
    constructor(db) {
        this.database = db;
        // console.log(schema.getTypeMap()["Person"]);

        this.rootResolver = {
            Query: {
                Person_GET: () => {
                    return this.database.getSubs("http://schema.org/Person");
                },
                Organization_GET: () => {
                    return this.database.getSubs("http://schema.org/Organization");
                },
                // Mutation: {

                //     Organization_UPSERT(input: Organization_INPUT): Boolean
                //     Organization_DELETE(input: Organization_INPUT): Boolean
                //     Person_UPSERT(input: Person_INPUT): Boolean
                //     Person_DELETE(input: Person_INPUT): Boolean
                // }

            }
        }

        // let newResolver = "Person"
        // let newResolverBody = {}
        // newResolverBody['_id'] = (parent) => { return parent }
        // newResolverBody['name'] = (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/name") }
        // newResolverBody['affiliation'] = (parent) => { return this.database.getObjs(parent, "http://schema.org/affiliation") }
        // this.rootResolver[newResolver] = newResolverBody


        // -------------------------------------------------- Create Query resolvers
        this.createQueryResolvers();
        this.createMutationResolvers();


    }

    createMutationResolvers(){
        console.log("createMutationResolvers");
        this.database.create("a","b","c");
    }

    // Query resolvers are based on schemaTree
    createQueryResolvers(){
        // -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE

        const schemaTree = createTree();

        // console.log(schemaTree)
        // console.dir(schemaTree);


        // -------------------------------------------------- CREATE RESOLVERS
        let objectsFromSchemaTree = []
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