
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
            Person: {
                _id: (parent) => {return parent},
                name: (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/name") },
                affiliation: (parent) => { return this.database.getObjs(parent, "http://schema.org/affiliation") }
            },
            Organization: {
                _id: (parent) => {return parent},
                legalName: (parent) => { return this.database.getSingleStringValue(parent, "http://schema.org/legalName") },
                employee: (parent) => { return this.database.getObjs(parent, "http://schema.org/employee") }
            }
        }
    }
}

module.exports = rootResolver