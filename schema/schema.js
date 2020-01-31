let schemaString = `
"""
Exposes linked data context mapppings for this schema. Response to the full
_CONTEXT query returns a valid JSON-LD context sufficient to interpret data
returned by other queries and inserted via mutations.
"""
type _CONTEXT {
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

  """http://schema.org/Patient"""
  Patient: String

  """http://schema.org/Text"""
  Text: String

  """http://schema.org/Number"""
  Number: String

  """http://schema.org/Integer"""
  Integer: String

  """http://schema.org/legalName"""
  legalName: String

  """http://schema.org/hasShareholder"""
  hasShareholder: String

  """http://schema.org/shareholderOf"""
  shareholderOf: String

  """http://schema.org/employee"""
  employee: String

  """http://schema.org/affiliation"""
  affiliation: String

  """http://schema.org/noOfEmployees"""
  noOfEmployees: String

  """http://schema.org/name"""
  name: String
}

"""All datatypes in the schema."""
enum _DATATYPES {
  Integer
  Number
  Text
}

enum _Integer_ {
  Integer
}

"""Any object in the database."""
type _OBJECT {
  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this project."""
    inferred: Boolean = false
  ): [String]
}

"""All object types in the schema."""
enum _OBJECT_TYPES {
  Organization
  Patient
  Person
  Thing
}

enum _Organization_ {
  Organization
}
 

enum _Person_ {
  Person
}

enum _Text_ {
  Text
}

"""The filler for the property affiliation"""
input affiliation_INPUT {
  """The type of the property filler."""
  _type: _Organization_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property employee"""
input employee_INPUT {
  """The type of the property filler."""
  _type: _Person_

  """The URI identfier of the object."""
  _id: ID!
}

"""The filler for the property hasShareholder"""
input hasShareholder_INPUT {
  """The type of the property filler."""
  _type: _Organization_

  """The URI identfier of the object."""
  _id: ID

  """The literal data value of the property."""
  _value: String
}

"""
This is integer DataType.

Broader types: Number
"""
type Integer {
  """The literal data value for the property."""
  _value(
    """The value of this property must be on the provided list."""
    only: [String]

    """The value of the property must contain the specified string."""
    contains: String

    """The language of the string value (if recognized)."""
    lang: String
  ): String

  """Asserted data type of this value."""
  _type: [String]
}

"""The filler for the property legalName"""
input legalName_INPUT {
  """The type of the property filler."""
  _type: _Text_

  """The literal data value of the property."""
  _value: String!
}

"""CRUD operations over objects of specifc types."""
type Mutation {
  """Creates a new object with the provided ID."""
  CREATE(
    """A valid, new URI for the created object."""
    id: ID!
  ): Boolean

  """
  Deletes an existing object by the provided ID (including all data about it).
  """
  DELETE(
    """A valid URI of an existing object"""
    id: ID!
  ): Boolean

  """Perform mutation over an object of type: Thing."""
  Thing(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Thing_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Organization."""
  Organization(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Organization_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Person."""
  Person(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Person_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Patient."""
  Patient(
    """The type of the mutation to be applied."""
    type: MutationType!

    """
    Throw error (instead of a warning) in case the object does not exist prior to the mutation.
    """
    ensureExists: Boolean

    """The input object of the mutation."""
    input: Patient_INPUT!
  ): Boolean
}

enum MutationType {
  """
  Add specified data about an object, provided the object exists and the data is consistent with the current knowledge base.
  """
  INSERT

  """Remove all specified data from the current knowledge base."""
  REMOVE

  """
  Replace the existing object with its new version specified in the input.
  """
  UPDATE
}

"""The filler for the property name"""
input name_INPUT {
  """The type of the property filler."""
  _type: _Text_

  """The literal data value of the property."""
  _value: String!
}

"""The filler for the property noOfEmployees"""
input noOfEmployees_INPUT {
  """The type of the property filler."""
  _type: _Integer_

  """The literal data value of the property."""
  _value: String!
}

"""This is number DataType."""
type Number {
  """The literal data value for the property."""
  _value(
    """The value of this property must be on the provided list."""
    only: [String]

    """The value of the property must contain the specified string."""
    contains: String

    """The language of the string value (if recognized)."""
    lang: String
  ): String

  """Asserted data type of this value."""
  _type: [String]
}

"""
An organization such as a school, NGO, corporation, club, etc.

Broader types: Thing
"""
type Organization {
  """
  The official name of the organization, e.g. the registered company name.
  """
  legalName: Text

  """Has a shareholder."""
  hasShareholder: [Organization]

  """Is a shareholder of an organization."""
  shareholderOf: [Organization]

  """An employee of an organization."""
  employee(
    """Include inferred types for this project."""
    filter: Filter
  ): [Person]

  """The number of employees in an organization."""
  noOfEmployees: Integer

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this project."""
    inferred: Boolean = false
  ): [String]
 
}

"""
An organization such as a school, NGO, corporation, club, etc.

Broader types: Thing
"""
input Organization_INPUT {
  """
  The official name of the organization, e.g. the registered company name.
  """
  legalName: legalName_INPUT

  """Has a shareholder."""
  hasShareholder: [hasShareholder_INPUT]

  """Is a shareholder of an organization."""
  shareholderOf: [shareholderOf_INPUT]

  """An employee of an organization."""
  employee: [employee_INPUT]

  """The number of employees in an organization."""
  noOfEmployees: noOfEmployees_INPUT

  """The name of an entity."""
  name: name_INPUT

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
} 

"""
A patient

Broader types: Person, Thing
"""
type Patient {
  """Is a shareholder of an organization."""
  shareholderOf: [Organization]

  """Affiliation of a person."""
  affiliation: [Organization]

  """The name of an entity."""
  name: Text

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this project."""
    inferred: Boolean = false
  ): [String]
 
}

"""
A patient

Broader types: Person, Thing
"""
input Patient_INPUT {
  """Is a shareholder of an organization."""
  shareholderOf: [shareholderOf_INPUT]

  """Affiliation of a person."""
  affiliation: [affiliation_INPUT]

  """The name of an entity."""
  name: name_INPUT

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

 

"""
A person

Broader types: Thing
"""
type Person {
  """Is a shareholder of an organization."""
  shareholderOf: [Organization]

  """Affiliation of a person."""
  affiliation(
    """Include inferred types for this project."""
    filter: Filter
  ): [Organization]

  """The name of an entity."""
  name: Text

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this project."""
    inferred: Boolean = false
  ): [String]
 
}

"""
A person

Broader types: Thing
"""
input Person_INPUT {
  """Is a shareholder of an organization."""
  shareholderOf: [shareholderOf_INPUT]

  """Affiliation of a person."""
  affiliation: [affiliation_INPUT]

  """The name of an entity."""
  name: name_INPUT

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""Get objects of specific types."""
type Query {
  """
  The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema.
  """
  _CONTEXT: _CONTEXT

  """List objects in the database."""
  _OBJECT(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter
  ): [_OBJECT]

  """Get objects of type: Thing."""
  Thing(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Thing]

  """Get objects of type: Organization."""
  Organization(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Organization]

  """Get objects of type: Person."""
  Person(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Person]

  """Get objects of type: Patient."""
  Patient(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Filter

    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Patient]
}

"""The filler for the property shareholderOf"""
input shareholderOf_INPUT {
  """The type of the property filler."""
  _type: _Organization_

  """The URI identfier of the object."""
  _id: ID!
}

"""This is text DataType."""
type Text {
  """The literal data value for the property."""
  _value(
    """The value of this property must be on the provided list."""
    only: [String]

    """The value of the property must contain the specified string."""
    contains: String

    """The language of the string value (if recognized)."""
    lang: String
  ): String

  """Asserted data type of this value."""
  _type: [String]
}

"""Anything."""
type Thing {
  """The name of an entity."""
  name: Text

  """The URI identfier of the object."""
  _id(
    """The URI must be on the provided list of URIs."""
    only: [String]
  ): ID!

  """Types of the object."""
  _type(
    """Include inferred types for this project."""
    inferred: Boolean = false
  ): [String]
}

"""Anything."""
input Thing_INPUT {
  """The name of an entity."""
  name: name_INPUT

  """The URI identfier of the object."""
  _id: ID!

  """Types of the object."""
  _type: [_OBJECT_TYPES]
}

"""Filter."""
input Filter {
  """id"""
  _id: [ ID ]

  """http://schema.org/legalName"""
  legalName: [String]

  """http://schema.org/noOfEmployees"""
  noOfEmployees: [String] 

  """http://schema.org/name"""
  name: [String]
}
`;

module.exports = schemaString;
