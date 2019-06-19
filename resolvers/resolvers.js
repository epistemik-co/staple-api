
class rootResolver {
    constructor(db) {
        this.database = db;
        const json = require('./schema-mapping.json');


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


        let objectsFromSchemaMapping = []

        for (var property in json.types) {
            objectsFromSchemaMapping.push( json.types[property] );
        }

        objectsFromSchemaMapping.forEach(async object => {
            console.log("\nNEW OBJECT\n")

            
            if (object.type  !== 'ObjectType') {
                // TYPE
                console.log(object)

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
                        if(json.types[object.fields[property]['name']] !== undefined){

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

        console.log("\n\n")
        console.dir(this.rootResolver);


    }
}

module.exports = rootResolver