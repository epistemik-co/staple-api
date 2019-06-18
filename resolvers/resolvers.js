
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
            Organization: {
                _id: (parent) => { return parent },
                legalName: (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/legalName") },
                employee: (parent) => { return this.database.getObjs(parent, "http://schema.org/employee") }
            }
        }

        let newResolver = "Person"
        let newResolverBody = {}
        newResolverBody['_id'] = (parent) => { return parent }
        newResolverBody['name'] = (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/name") }
        newResolverBody['affiliation'] = (parent) => { return this.database.getObjs(parent, "http://schema.org/affiliation") }


        this.rootResolver[newResolver] = newResolverBody


        let objects = []

        for (var property in json.types) {
            if (json.types.hasOwnProperty(property)) {
                objects.push(json.types[property]);
            }
        }

        objects.forEach(element => {
            console.log("\nNEW OBJECT\n")

            if (element.type  !== 'ObjectType') {
                // TYPE

                let newResolver = element.name
                let newResolverBody = {}

                for (var property in element.fields) {
                    if(element.fields[property]['name']  === '_value'){
                        newResolverBody['_value'] = (parent) => { return parent }
                    }
                    newResolverBody[element.fields[property]['name']] = (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/"+element.fields[property]['name']) }
                }

                this.rootResolver[newResolver] = newResolverBody


            } else {
                // OBJECT

                let newResolver = element.name
                let newResolverBody = {}

                for (var property in element.fields) {
                    if(element.fields[property]['name']  === '_id'){
                        newResolverBody['_id'] = (parent) => { return parent }
                    }
                    else if(element.fields[property]['name']  === '_type'){
                        newResolverBody[element.fields[property]['name']] = (parent) => { return this.database.getObjs(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") }
                    }
                    else{
                        if(json.types[element.fields[property]['name']] !== undefined){
                            newResolverBody[element.fields[property]['name']] = (parent) => { return this.database.getObjs(parent, "http://schema.org/"+element.fields[property]['name']) }
                        }
                        else{
                            newResolverBody[element.fields[property]['name']] = (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/"+element.fields[property]['name']) }
                        }
                    }
                }

                this.rootResolver[newResolver] = newResolverBody

            }

        });

        console.log("\n\n\n\n\n\n\n\n\n\n")
        console.dir(this.rootResolver);


    }
}

module.exports = rootResolver