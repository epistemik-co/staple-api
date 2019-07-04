schemaString = `
"""
Exposes linked data context mapppings for this schema. Response to the full
_Context query returns a valid JSON-LD context sufficient to interpret data
returned by other queries and inserted via mutations.
"""
type _Context {
  """@id"""
  _id: String

  """@value"""
  _value: String

  """@type"""
  _type: String

  """http://schema.org/Thing"""
  Thing: String

  """http://schema.org/Organization"""
  Organization: String

  """http://schema.org/Person"""
  Person: String

  """http://schema.org/Text"""
  Text: String

  """http://schema.org/Integer"""
  Integer: String

  """http://schema.org/legalName"""
  legalName: String

  """http://schema.org/shareholder"""
  shareholder: String

  """http://schema.org/employee"""
  employee: String

  """http://schema.org/noOfEmployees"""
  noOfEmployees: String
}

"""The filler for the property employee"""
input employee_INPUT {
  """The type of the property filler."""
  _type: employee_TYPES!

  """The URI identfier of the object."""
  _id: ID!
}

enum employee_TYPES {
  Person
}

"""Text."""
type Integer {
  """The literal data value for the property."""
  _value(
    """The value of the property must be within the specifed set."""
    only: [String]

    """The value of the property must contain the specified string."""
    contains: String

    """The language of the string value (if recognized)."""
    lang: String
  ): String

  """The known types of the object."""
  _type: [String]
}

"""The filler for the property legalName"""
input legalName_INPUT {
  """The type of the property filler."""
  _type: legalName_TYPES!

  """The literal data value of the property."""
  _value: String!
}

enum legalName_TYPES {
  Text
}

"""CRUD operations over objects of specifc types."""
type Mutation {
  DELETE(
    """Delete all data about the object specified by the provided ID."""
    id: ID!
  ): Boolean
  Thing(type: MutationType!, input: Thing_INPUT!): Boolean
  Organization(type: MutationType!, input: Organization_INPUT!): Boolean
  Person(type: MutationType!, input: Person_INPUT!): Boolean
}

enum MutationType {
  """
  Create a new object with specified properties, provided it does not yet exist.
  """
  CREATE

  """
  Replace the existing object with its new version specified in the input.
  """
  UPDATE

  """
  Add specified data about an object, provided the object exists and the data is consistent with the current knowledge base.
  """
  INSERT

  """Remove all specified data from the current knowledge base."""
  REMOVE
}

"""The filler for the property noOfEmployees"""
input noOfEmployees_INPUT {
  """The type of the property filler."""
  _type: noOfEmployees_TYPES!

  """The literal data value of the property."""
  _value: String!
}

enum noOfEmployees_TYPES {
  Integer
}

enum OBJECT_TYPES {
  Thing
  Organization
  Person
}

"""An organization such as a school, NGO, corporation, club, etc."""
type Organization {
  """
  The official name of the organization, e.g. the registered company name.
  """
  legalName: Text

  """
  The official name of the organization, e.g. the registered company name.
  """
  shareholder: [Organization_v_Person_v_Text]
  """
  The official name of the organization, e.g. the registered company name.
  """
  employee: Person
  """
  The official name of the organization, e.g. the registered company name.
  """
  noOfEmployees: [Integer]
  """The URI identfier of the object."""
  _id(
    """The URI must belong to the specified list."""
    only: [String]
  ): ID!
  """The known types of the object."""
  _type: [String]
}
"""An organization such as a school, NGO, corporation, club, etc."""
input Organization_INPUT {
  """
  The official name of the organization, e.g. the registered company name.
  """
  legalName: [legalName_INPUT]
  """
  The official name of the organization, e.g. the registered company name.
  """
  shareholder: [shareholder_INPUT]
  """
  The official name of the organization, e.g. the registered company name.
  """
  employee: [employee_INPUT]
  """
  The official name of the organization, e.g. the registered company name.
  """
  noOfEmployees: [noOfEmployees_INPUT]
  """The URI identfier of the object."""
  _id: ID!
  """The known types of the object."""
  _type: [OBJECT_TYPES]
}
"""A filler of any of the types: Organization, Person, Text."""
union Organization_v_Person_v_Text = Organization | Person | Text
type Person {
  """
  The official name of the organization, e.g. the registered company name.
  """
  legalName: [Text]
  """The URI identfier of the object."""
  _id(
    """The URI must belong to the specified list."""
    only: [String]
  ): ID!
  """The known types of the object."""
  _type: [String]
}
input Person_INPUT {
  """
  The official name of the organization, e.g. the registered company name.
  """
  legalName: [legalName_INPUT]
  """The URI identfier of the object."""
  _id: ID!
  """The known types of the object."""
  _type: [OBJECT_TYPES]
}
"""Get objects of specific types."""
type Query {
  """
  The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema.
  """
  _Context: [_Context]
  Thing(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
  ): [Thing]
  Organization(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
  ): [Organization]
  Person(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
  ): [Person]
}
"""The filler for the property shareholder"""
input shareholder_INPUT {
  """The type of the property filler."""
  _type: shareholder_TYPES!
  """The URI identfier of the object."""
  _id: ID
  """The literal data value of the property."""
  _value: String
}
enum shareholder_TYPES {
  Organization
  Person
  Text
}
"""Text."""
type Text {
  """The literal data value for the property."""
  _value(
    """The value of the property must be within the specifed set."""
    only: [String]
    """The value of the property must contain the specified string."""
    contains: String
    """The language of the string value (if recognized)."""
    lang: String
  ): String

  """The known types of the object."""
  _type: [String]
}

"""Anything."""
type Thing {
  """The URI identfier of the object."""
  _id(
    """The URI must belong to the specified list."""
    only: [String]
  ): ID!

  """The known types of the object."""
  _type: [String]
}

"""Anything."""
input Thing_INPUT {
  """The URI identfier of the object."""
  _id: ID!

  """The known types of the object."""
  _type: [OBJECT_TYPES]
}
`

module.exports = schemaString