
class rootResolver{
	constructor(db) {
		this.database = db;
    
        this.rootResolver = {
            Query: {
                Person_GET: () =>{
                    return this.database.getSubs("http://schema.org/Person");
                },
                Organization_GET: () =>{
                    return this.database.getSubs("http://schema.org/Organization");
                }
            },
            Organization: {
                _id: (parent) => {return parent},
                legalName: (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/legalName") },
                employee: (parent) => { return this.database.getObjs(parent, "http://schema.org/employee") }
            }
        }

        let newResolver = "Person"
        let newResolverBody = {}
        newResolverBody['_id'] = (parent) => {return parent}
        newResolverBody['name'] = (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/name") }
        newResolverBody['affiliation'] = (parent) => { return this.database.getObjs(parent, "http://schema.org/affiliation") }


        this.rootResolver[newResolver] = newResolverBody


        
    }
}

module.exports = rootResolver