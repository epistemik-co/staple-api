const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaString = require('./schema');
const schemaMapping = require('./schema-mapping');

// -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE
createTree = () => {
    const schema = buildSchemaFromTypeDefinitions(schemaString);
    let treeFromSchema = {};

    const systemTypes = [
        'Query',
        'Mutation',
        "_Context",
        'ID',
        'String',
        '__Schema',
        '__Type',
        '__TypeKind',
        'Boolean',
        '__Field',
        '__InputValue',
        '__EnumValue',
        '__Directive',
        '__DirectiveLocation',
        'Int',
        'Float',
        'Boolean',
    ];

    let objectsFromSchemaMapping = [];

    for (var property in schemaMapping.types) { objectsFromSchemaMapping.push(schemaMapping.types[property]); };

    // console.log(objectsFromSchemaMapping);

    for (let schemaTypeName in schema.getTypeMap()) {
        let newNode = {}; // object that will be added to tree
        let newNodeFromMappingTree = false; // node that contain data from schema-mapping for specyfic object
        let newNodeData = {}; // data that will be added as a field

        // skip system types and inputs
        if (systemTypes.indexOf(schemaTypeName) > -1) {
            continue;
        }
        // console.log(schemaTypeName)

        // create field for type field from schema
        newNode['name'] = schema.getTypeMap()[schemaTypeName]['name'];

        if (schema.getTypeMap()[schemaTypeName].astNode.kind === "EnumTypeDefinition") {
            newNode['type'] = "EnumType";
            newNode['values'] = schema.getTypeMap()[schemaTypeName].astNode.values.map(x => {
                return x.name.value;
            })
            treeFromSchema[schema.getTypeMap()[schemaTypeName]['name']] = newNode;
            
        }
        else if (schema.getTypeMap()[schemaTypeName].astNode.kind === "UnionTypeDefinition") {
            newNode['type'] = "UnionType";
            newNode['values'] = schema.getTypeMap()[schemaTypeName].astNode.types.map(x => {
                return x.name.value;
            })
            treeFromSchema[schema.getTypeMap()[schemaTypeName]['name']] = newNode;
        }
        else if (schema.getTypeMap()[schemaTypeName].astNode.kind === "InputObjectTypeDefinition") {
            // Skip input ??
            // newNode['type'] = "InputObjectType";
            // console.log("\n");
            // newNode['values'] = schema.getTypeMap()[schemaTypeName].astNode.fields.map(x => {
            //     console.log(x)
            //     return x
            // })
            //treeFromSchema[schema.getTypeMap()[schemaTypeName]['name']] = newNode;
        }
        else if (schema.getTypeMap()[schemaTypeName].astNode.kind === "ObjectTypeDefinition") {
            newNode['type'] = "ObjectType";

            // find uri and type of the type field from schema
            objectsFromSchemaMapping.forEach(object => {
                if (object['name'] === schema.getTypeMap()[schemaTypeName]['name']) {
                    newNode['uri'] = object['uri'];
                    newNode['type'] = object['type'];
                    newNodeFromMappingTree = object.fields;
                    // console.log("GOT something from schema mapping")
                }
            });

            schema.getTypeMap()[schemaTypeName].astNode.fields.map(object => {
                newNodeData[object.name.value] = {};
                let copyOfNewNode = newNodeData[object.name.value];
                let prop = object['type'];

                while (prop !== undefined) {
                    // save information if it is mandatory and skip
                    if (prop['kind'] === 'NonNullType') {
                        copyOfNewNode['mandatory'] = true;
                        prop = prop['type'];
                    }
                    else {
                        copyOfNewNode['mandatory'] = false;
                    }
                    // this is the root where we get the value
                    if (prop['kind'] === 'NamedType') {
                        // console.log("PROP\n")
                        // console.log(prop)
                        copyOfNewNode['name'] = prop['name']['value'];

                        if (newNodeFromMappingTree){
                            newNodeFromMappingTree.forEach(object2 => {
                                if (object2['name'] === object.name.value) {
                                    copyOfNewNode['uri'] = object2['uri'];
                                }
                            });
                        }

                    }
                    else {
                        copyOfNewNode['kind'] = prop['kind']
                        copyOfNewNode['data'] = {}
                    }
                    prop = prop['type'];
                    copyOfNewNode = copyOfNewNode['data'];
                }
            });

            newNode['data'] = newNodeData;
            treeFromSchema[schema.getTypeMap()[schemaTypeName]['name']] = newNode;
        }
        else{
            console.log("---------------- NEW NODE KIND ----------------")
            console.log(schema.getTypeMap()[schemaTypeName].astNode.kind);
        }

    }

    // -------------------------------------------------- SAVE TO FILE

    // var jsonContent = JSON.stringify(treeFromSchema)
    // const fs = require('fs');
    // fs.writeFile("output.json", jsonContent, 'utf8', function (err) {
    //     if (err) {
    //         console.log("An error occured while writing JSON Object to File.");
    //         return console.log(err);
    //     }

    //     console.log("JSON file has been saved.");
    // });

    return treeFromSchema;
}


module.exports = createTree