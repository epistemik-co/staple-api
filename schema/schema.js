schemaString = `
type Mutation {
    setMessage(message: String): String
}

type Query {
    Organization_GET: [Organization]
    Person_GET: [Person]
}

type Organization {
_id: ID!
_type: [String]
legalName: Text
address: Text
department: [Organization]
employee: [Person]
email: Text
numberOfEmployees: Integer

}

type Person {
_id: ID!
_type: [String]
name: Text
affiliation: Organization
}

type Text {
_type: [String]
_value: String
}

type Integer {
_type: [String]
_value: String
}
`

module.exports = schemaString