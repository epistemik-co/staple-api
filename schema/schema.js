let schemaString = `
"""An agent"""
type Agent {
  """Name of the agent"""
  name: String
  """The unique identifier of the object."""
  _id: ID!
  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]
}
"""
An organization such as a school, NGO, corporation, club, etc.
Broader types: Agent
"""
type Organization {
"""Name of the agent."""
  name: String
  """An employee of an organization."""
  employee: [Person]
  """The annual revenue of the organization."""
  revenue: Float
  """The unique identifier of the object."""
  _id: ID!
  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]
}
"""
A person
Broader types: Agent
"""
type Person {
  """Name of the agent."""
  name: String
  """Age of the person."""
  age: Int
  """The person is married."""
  isMarried: Boolean
  """The unique identifier of the object."""
  _id: ID!
  """Types of the object."""
  _type(
    """Include inferred types for this object."""
    inferred: Boolean = false
  ): [String]
}
"""Filter on type Agent"""
input Agent_FILTER {
  """Possible values on field: _id)."""
  _id: [ID]
  """Possible values on field: name"""
  name: [String]
}
"""Filter on type Organization"""
input Organization_FILTER {
  """Possible values on field: _id)."""
  _id: [ID]
  """Possible values on field: name."""
  name: [String]
  """Possible values on field: employee."""
  employee: [ID]
  """Possible values on field: revenue."""
  revenue: [Float]
}
"""Filter on type Person"""
input Person_FILTER {
  """Possible values on field: _id)."""
  _id: [ID]
  """Possible values on field: name."""
  name: [String]
  """Possible values on field: age."""
  age: [Int]
  """Possible values on field: isMarried."""
  isMarried: [Boolean]
}
"""Get objects of specific types."""
type Query {
  """
  The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema.
  """
  _context: String
  """Get objects of type: Agent."""
  Agent(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Agent_FILTER
    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Agent]
  """Get objects of type: Organization."""
  Organization(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Organization_FILTER
    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Organization]
  """Get objects of type: Person."""
  Person(
    """
    The number of the consecutive results page to be returned by the query.
    """
    page: Int = 1
    filter: Person_FILTER
    """Include inferred objects of this type."""
    inferred: Boolean = false
  ): [Person]
}
`;

module.exports = schemaString;
