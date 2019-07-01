schemaString = `
type Query {

_Context: [_Context]
Organization(page:Int): [Organization]
Person(page:Int): [Person]

}

type Mutation {

Organization(type:MutationType!, input:Organization_INPUT!): Boolean
Person(type:MutationType!, input:Person_INPUT!): Boolean
Delete(id:ID!): Boolean

}

enum MutationType {
INSERT
UPDATE
REMOVE
CREATE
}

input Person_INPUT {
_id: ID!
_type: [OBJECT_TYPES]
name: name_INPUT
affiliation: affiliation_INPUT
}

input Organization_INPUT {
_id: ID!
_type: [OBJECT_TYPES]
legalName: legalName_INPUT
address: address_INPUT 
department: [department_INPUT]
employee: [employee_INPUT]
email: email_INPUT
numberOfEmployees: numberOfEmployees_INPUT
shareholder: [shareholder_INPUT]
}

input name_INPUT {
_type: name_TYPES!
_value: String!
}

enum name_TYPES {
Text
}

input affiliation_INPUT {
_type: affiliation_TYPES!
_id: ID!
}

enum affiliation_TYPES {
Organization
}

input legalName_INPUT {
_type: legalName_TYPES!
_value: String!
}

enum legalName_TYPES {
Text
}

input address_INPUT {
_type: address_TYPES!
_value: String!
}

enum address_TYPES {
Text
}

input department_INPUT {
_type: department_TYPES!
_id: ID!
}

enum department_TYPES {
Organization
}

input employee_INPUT {
_type: employee_TYPES!
_id: ID!
}

enum employee_TYPES {
Person
}

input email_INPUT {
_type: email_TYPES!
_value: String!
}

enum email_TYPES {
Text
}

input numberOfEmployees_INPUT {
_type: numberOfEmployees_TYPES!
_value: String!
}

enum numberOfEmployees_TYPES {
Integer
}

input shareholder_INPUT {
_type: shareholder_TYPES!
_id: ID!
}

enum shareholder_TYPES {
Person
Organization
}

enum OBJECT_TYPES {
Person
Organization
}

enum DATA_TYPES {
Text
Integer
}

type Organization {
_id (only: [String]) : ID!
_baseType: [String]
_type: [String]
legalName: Text
address: Text
department: [Organization]
employee: [Person]
email: Text
numberOfEmployees: Integer
shareholder: [Organization_v_Person]
}

union Organization_v_Person = Organization | Person

type Person {
_id (only: [String]): ID!
_baseType: [String]
_type: [String]
name: Text
affiliation: Organization
}

type Text {
_baseType: [String]
_type: [String]
_value (only: [String], contains:String, lang:String): String
}

type Integer {
_baseType: [String]
_type: [String]
_value (only: [String]): Int
}


type _Context {
_id: String
_type: String
_value: String
Person: String
Organization: String
Text: String
Integer: String
name: String
affiliation: String
legalName: String
address: String
department: String
employee: String
email: String
numberOfEmployees: String
shareholder: String
}
`

module.exports = schemaString