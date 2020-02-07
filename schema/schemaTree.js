const { buildSchemaFromTypeDefinitions } = require("graphql-tools");
const schemaString = require("./schema");
let schemaMapping = undefined;
var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);


const getUris = (object, name, listOfUnions) => {
    let uri = schemaMapping["@context"][object.name.value]; // basic type
    if (uri === undefined) { // defined type
        uri = schemaMapping["@context"][name];
    }
    if (uri === undefined) { // union
        let typesOfNode = listOfUnions.filter((x) => {
            let tempNode = object.type; 
            return x.name.value === tempNode.name.value;
        })[0]; // get types of union

        if (typesOfNode === undefined) {
            typesOfNode = [];
        }
        else {
            typesOfNode = typesOfNode.types;
        }
        uri = [];
        typesOfNode.map((typeOfNode) => {
            let oneUri = schemaMapping["@context"][typeOfNode.name.value]; // copyOfNewNode.name
            if (oneUri === undefined) {
                logger.error(`ERROR URI IS UNDEFINED FOR ${typeOfNode} in schema-tree`);
            }
            uri.push(oneUri);
        });
    }

    return uri;

};

const handleEnumType = (newNode, schema, schemaTypeName) => {
    newNode["type"] = "EnumType";
    newNode["values"] = schema.getTypeMap()[schemaTypeName].astNode.values.map(x => {
        return x.name.value;
    });
};

const handleUnionType = (newNode, schema, schemaTypeName) => {
    newNode["type"] = "UnionType";
    newNode["values"] = schema.getTypeMap()[schemaTypeName].astNode.types.map(x => {
        return x.name.value;
    });
};

const handleObjectType = (newNode, newNodeData, schema, schemaTypeName, listOfUnions) => {
    newNode["type"] = "ObjectType";

    // find uri and type of the type field from schema

    let id = schemaMapping["@context"][schema.getTypeMap()[schemaTypeName]["name"]];

    if(id === undefined && schemaTypeName !== "_CONTEXT" && schemaTypeName !== "_OBJECT"){
        newNode["uri"] = schemaTypeName;
        newNode["type"] = "Reverse";
    }
    else{
        newNode["uri"] = id;

        // let tempNewNodeType = schemaMapping["@graph"].filter((x) => { return x["@id"] === id })[0];
        let tempNewNodeType = schemaMapping["@graphMap"][id];

        if (tempNewNodeType === undefined) {
            newNode["type"] = undefined;
        }
        else {
            newNode["type"] = tempNewNodeType["@type"];
        }
    }

    schema.getTypeMap()[schemaTypeName].astNode.fields.map(object => {
        newNodeData[object.name.value] = {};
        let copyOfNewNode = newNodeData[object.name.value];
        let prop = object["type"];
        
 
        while (prop !== undefined) {
            copyOfNewNode["ListType"] = false;
            if(prop["kind"] === "ListType" && prop["type"] !== undefined){
                prop = prop["type"];
                copyOfNewNode["ListType"] = true;
            }

            if (prop["kind"] === "NonNullType") {
                prop = prop["type"];
            }
            // this is the root where we get the value
            if (prop["kind"] === "NamedType") { 
                copyOfNewNode["name"] = prop["name"]["value"];
                copyOfNewNode["uri"] = getUris(object, copyOfNewNode["name"], listOfUnions);

            }
            else { 
                copyOfNewNode["kind"] = prop["kind"];
                copyOfNewNode["data"] = {};
                logger.warn("Unexpected node in schema:");
                logger.debug(prop);
            }

            prop = prop["type"];
            copyOfNewNode = copyOfNewNode["data"];
        }
    });

    newNode["data"] = newNodeData;
};

const saveTreeToFile = (treeFromSchema, path) => {
    var jsonContent = JSON.stringify(treeFromSchema);
    const fs = require("fs");
    fs.writeFile(path, jsonContent, "utf8", function (err) {
        if (err) {
            logger.error("An error occured while writing JSON Object to File.");
            return logger.error(err);
        }

        logger.info("JSON file has been saved.");
    });
};

// -------------------------------------------------- RENDER SCHEMA + SCHEMA-MAPPING TREE
const createTree = (schemaMappingArg) => {
    schemaMapping = schemaMappingArg;
    const schema = buildSchemaFromTypeDefinitions(schemaString);
    let treeFromSchema = {};

    const systemTypes = [
        "Query",
        "Mutation",
        "_Context",
        "ID",
        "String",
        "__Schema",
        "__Type",
        "__TypeKind",
        "Boolean",
        "__Field",
        "__InputValue",
        "__EnumValue",
        "__Directive",
        "__DirectiveLocation",
        "Int",
        "Float",
        "Boolean",
    ];


    let listOfUnions = [];
    for (let schemaTypeName in schema.getTypeMap()) {
        if (systemTypes.indexOf(schemaTypeName) > -1) {
            continue;
        }

        if (schema.getTypeMap()[schemaTypeName].astNode.kind == "UnionTypeDefinition") {
            listOfUnions.push(schema.getTypeMap()[schemaTypeName].astNode);
        }
    }

    for (let schemaTypeName in schema.getTypeMap()) {
        let newNode = {}; // object that will be added to tree
        let newNodeData = {}; // data that will be added as a field

        // skip system types and inputs
        if (systemTypes.indexOf(schemaTypeName) > -1) {
            continue;
        }

        // create field for type field from schema
        newNode["name"] = schema.getTypeMap()[schemaTypeName]["name"];

        if (schema.getTypeMap()[schemaTypeName].astNode.kind === "EnumTypeDefinition") {
            handleEnumType(newNode, schema, schemaTypeName);
        }
        else if (schema.getTypeMap()[schemaTypeName].astNode.kind === "UnionTypeDefinition") {
            handleUnionType(newNode, schema, schemaTypeName);
        }
        else if (schema.getTypeMap()[schemaTypeName].astNode.kind === "InputObjectTypeDefinition") {
            // Skip input ??
            continue;
        }
        else if (schema.getTypeMap()[schemaTypeName].astNode.kind === "ObjectTypeDefinition") {
            handleObjectType(newNode, newNodeData, schema, schemaTypeName, listOfUnions);
        }
        else {
            logger.warn(`NEW NODE KIND: ${schema.getTypeMap()[schemaTypeName].astNode.kind}`);
            continue;
        }
        treeFromSchema[schema.getTypeMap()[schemaTypeName]["name"]] = newNode;
    }

    saveTreeToFile(treeFromSchema, "../output.json"); 
    return treeFromSchema;
};


module.exports = createTree;