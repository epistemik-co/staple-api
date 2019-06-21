const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaString = require('../schema/schema');
const schemaMapping = require('./schema-mapping');

// -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE
createTree = () => {
    const schema = buildSchemaFromTypeDefinitions(schemaString);
    let treeFromSchema = {};

    const systemTypes = [
        'Query',
        'Mutation',
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

    for (let schemaTypeName in schema.getTypeMap()) {
        let newNode = {}; // object that will be added to tree
        let newNodeFromMappingTree = {}; // node that contain data from schema-mapping for specyfic object
        let newNodeData = {}; // data that will be added as a field
        // skip system types
        if (systemTypes.indexOf(schemaTypeName) > -1) {
            continue;
        }
        // console.log(schemaTypeName)

        // create field for type field from schema
        newNode['name'] = schema.getTypeMap()[schemaTypeName]['name'];
        
        // find uri and type of the type field from schema
        objectsFromSchemaMapping.forEach(object => {
            if (object['name'] === schema.getTypeMap()[schemaTypeName]['name']) {
                newNode['uri'] = object['uri'];
                newNode['type'] = object['type'];
                newNodeFromMappingTree = object.fields;
            }
        });

        schema.getTypeMap()[schemaTypeName].astNode.fields.map(object => {
            // console.log(object)
            newNodeData[object.name.value] = {};
            let copyOfNewNode = newNodeData[object.name.value];
            let prop = object['type'];

            while(prop !== undefined){
                // save information if it is mandatory and skip
                if(prop['kind'] === 'NonNullType'){
                    copyOfNewNode['mandatory'] = true;
                    prop = prop['type'];
                }
                else{
                    copyOfNewNode['mandatory'] = false;
                }
                // this is the root where we get the value
                if(prop['kind'] === 'NamedType'){
                    // console.log(prop)
                    copyOfNewNode['name'] = prop['name']['value'];
                    newNodeFromMappingTree.forEach(object2 => {
                        if(object2['name'] === object.name.value){
                            copyOfNewNode['uri'] = object2['uri'];
                        }
                    });
                }
                else{
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

    return treeFromSchema;
}


module.exports = createTree