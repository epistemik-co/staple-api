const { buildSchemaFromTypeDefinitions } = require('graphql-tools');
const schemaString = require('../schema/schema');

class rootResolver {
    constructor(db) {
        this.database = db;
        const json = require('./schema-mapping.json');

        const schema = buildSchemaFromTypeDefinitions(schemaString);


        // console.log(schema.getTypeMap()["Person"]);

        this.rootResolver = {
            Query: {
                Person_GET: () => {
                    return this.database.getSubs("http://schema.org/Person");
                },
                Organization_GET: () => {
                    return this.database.getSubs("http://schema.org/Organization");
                }
            },
            // Organization: {
            //     _id: (parent) => { return parent },
            //     legalName: (parent) => { return this.database.getSingleLiteral(parent, "http://schema.org/legalName") },
            //     employee: (parent) => { return this.database.getObjs(parent, "http://schema.org/employee") }
            // },
            // Person: {

            // },
            // Text: {
            //     _type: (parent) => {return [parent.datatype.value] },
            //     _value: (parent) => {return parent.value},
            // },
            // Integer: {
            //     _type: (parent) => { return this.database.getObjs(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") },
            //     _value: (parent) => {return parent},
            // }
        }

        // let newResolver = "Person"
        // let newResolverBody = {}
        // newResolverBody['_id'] = (parent) => { return parent }
        // newResolverBody['name'] = (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/name") }
        // newResolverBody['affiliation'] = (parent) => { return this.database.getObjs(parent, "http://schema.org/affiliation") }


        // this.rootResolver[newResolver] = newResolverBody

        const systemTypes = [
            'Query',
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
            '__DirectiveLocation'
        ];


        // chodzenie po drzewie

        var treeFromSchema = {}

        // console.log(schema.getTypeMap()['Organization'].astNode.fields[0])

        for(let schemaTypeName in schema.getTypeMap()){
            // skip system types
            if(systemTypes.indexOf(schemaTypeName) > -1){
                continue;
            }
            let newNode = {};
            newNode['name'] = schema.getTypeMap()[schemaTypeName]['name'];
            let newNodeData = {};
            
            // console.log(schema.getTypeMap()[schemaTypeName].astNode)
            schema.getTypeMap()[schemaTypeName].astNode.fields.map(object => {
                newNodeData[object.name.value] = {};
                let copyOfNewNode = newNodeData[object.name.value];
                
                let prop = object['type'];
                while(prop !== undefined){
                    //console.log(prop);
                    copyOfNewNode['kind'] = prop['kind']
                    if(prop['kind'] === 'NamedType'){
                        copyOfNewNode['data'] = {}
                        // console.log(prop)
                        copyOfNewNode['data']['Name'] = prop['name']['value']
                    }
                    else{
                        copyOfNewNode['data'] = {}
                    }
                    prop = prop['type'];
                    copyOfNewNode = copyOfNewNode['data'];
                }
            });

            newNode['data'] = newNodeData;
            treeFromSchema[schema.getTypeMap()[schemaTypeName]['name']] = newNode;
            // console.log(newNode);

        }

        // console.log(treeFromSchema['Organization']['data']['_id']['data']['data'])

        var jsonContent = JSON.stringify(treeFromSchema)
        const fs = require('fs');
        fs.writeFile("output.json", jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
         
            console.log("JSON file has been saved.");
        });


        for(let schemaTypeName in schema.getTypeMap()){
            // skip system types
            if(systemTypes.indexOf(schemaTypeName) > -1){
                continue;
            }
            const schemaTypeObject = schema.getTypeMap()[schemaTypeName].astNode;

            // console.log("\nschemaTypeName = " + schemaTypeName + " schemaTypeObject['name']['value'] = " + schemaTypeObject['name']['value'] + " \n")

            const arrayOfFieldsKind = schemaTypeObject.fields.map(x => x['type']['kind']);

            const arrayOfFields = schemaTypeObject.fields.map(x => {
               if( x['type']['kind'] === 'NamedType' ) { return x['type']['name']} else { return  x['type']['type'] }
            });


            // console.log(arrayOfFields.map(x => {
            //     if( x['kind'] === 'Name' ) { return x['value']} else { return  "[" + x['name']['value'] + "]" }
            //  }));

        }






























        let objectsFromSchemaMapping = []

        for (var property in json.types) {
            objectsFromSchemaMapping.push( json.types[property] );
        }

        objectsFromSchemaMapping.forEach(async object => {
            // console.log("\nNEW OBJECT\n")
            // const schemaForObject = schema.getTypeMap()[object['name']];
            // console.log(schemaForObject.astNode.fields.map(x => x['name']['value']))
            
            if (object.type  !== 'ObjectType') {
                // TYPE
                // console.log(object)

                let newResolver = object.name
                let newResolverBody = {}

                for (var property in object.fields) {
                    if(object.fields[property]['name']  === '_value'){
                        newResolverBody['_value'] = async (parent) => {return parent.value}
                    }
                    else if(object.fields[property]['name']  === '_type'){
                        newResolverBody['_type'] = (parent) => {return [parent.datatype.value] }
                    }
                }

                this.rootResolver[newResolver] = newResolverBody
                


            } else {
                // OBJECT
                // console.log(object)

                let newResolver = object.name 
                let newResolverBody = {}

                for (var property in object.fields) {
                    if(object.fields[property]['name']  === '_id'){
                        newResolverBody['_id'] = async (parent) => { return await parent }
                    }
                    else if(object.fields[property]['name']  === '_type'){
                        newResolverBody[object.fields[property]['name']] = async (parent) => { return await this.database.getObjs(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") }
                    }
                    else{
                        // console.log("object.fields[property]")
                        // console.log(object.fields[property]);
                        // console.log()
                        if(schema.getTypeMap()[object.fields[property]['name']] !== undefined){ // this is bad
                            
                            
                            const name = "http://schema.org/"+object.fields[property]['name'];
                            let constr = (name) => { return (parent) => { return this.database.getObjs(parent, name) } };
                            newResolverBody[object.fields[property]['name']] =  constr(name);
                        }
                        else{
                            
                            const name = "http://schema.org/" + object.fields[property]['name'];
                            let constr = (name) => { return  ((parent) => {return this.database.getSingleLiteral(parent, name) })};
                            newResolverBody[object.fields[property]['name']] = constr(name);
                        }
                    }
                    
                }

                this.rootResolver[newResolver] = newResolverBody

            }

        });

        // console.log("\n\n")
        // console.dir(this.rootResolver);


    }
}

module.exports = rootResolver