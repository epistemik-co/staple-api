schemaString = `
type Query {
    Organization_GET: [Organization]
    Person_GET: [Person]
}

type Mutation {
Organization_UPSERT(input: Organization_INPUT): Boolean
Organization_DELETE(input: Organization_INPUT): Boolean
Person_UPSERT(input: Person_INPUT): Boolean
Person_DELETE(input: Person_INPUT): Boolean

}

input Organization_INPUT {
_id: ID!
legalName: _InputNode
address: _InputNode 
department: [_InputNode]
employee: [_InputNode]
email: _InputNode
numberOfEmployees: _InputNode
}

input Person_INPUT {
_id: ID!
name: _InputNode
affiliation: _InputNode
}

input _InputNode {
    _type: String
    _value: String
    _id: String
 }


type Organization {
_id: ID!
_baseType: [String]
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
_baseType: [String]
_type: [String]
name: Text
affiliation: Organization
}

type Text {
_baseType: [String]
_type: [String]
_value: String
}

type Integer {
_baseType: [String]
_type: [String]
_value: Int
}

`

module.exports = schemaString