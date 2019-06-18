schemaString = `
        type Query {
            Person_GET: [Person]
            Organization_GET: [Organization]
        }
        type Organization {
            _id: ID!
            legalName: String
            employee: [Person]
        }
        type Person {
            _id: ID!
            name: String
            affiliation: [Organization]
        }
        `
        
module.exports = schemaString