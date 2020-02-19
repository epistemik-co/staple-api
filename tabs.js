module.exports = [{
    endpoint : process.env.GRAPHQL_BASIC_ENDPOINT,
    query: `{
    Organization {
      _id
      _type
      name
      employee {
        _id
        _type
        name
        customerOf {
          _id
        }
      }
    }
  }`}]