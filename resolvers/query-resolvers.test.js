const { makeExecutableSchema } = require('graphql-tools');
const { graphql } = require('graphql');
const DatabaseInterface = require('../database/database');
const database = new DatabaseInterface();
const Resolver = require('./resolvers');
const rootResolver = new Resolver(database).rootResolver;
const schemaString = require('../schema/schema');
const schemaMapping = require('../schema/schema-mapping');

const schema = makeExecutableSchema({
    typeDefs: schemaString,
    resolvers: rootResolver,
    customFormatErrorFn: error => {
        const { code, message } = error.originalError;
        return { code, message };
    }
});

afterEach(() => {
    database.drop();
});



describe('My Test Cases for query resolvers', () => {
    const CreateOrganizationQuery = `
        mutation{
            Organization(type: CREATE, input: {
            _id: "http://subject"
            _type: Organization
            legalName: {
                _value: "Nazwa firmy"
                _type: Text
            }
            employee: {
                _type: Person
                _id: "http://data/bluesB"
            }
            shareholder:{
                _type: Person
                _id: "http://data/bluesB"
            }
            noOfEmployees: {
                _type: Integer
                _value: "0"
            }
            })
        }
      
    `;

    const CreatePersonQuery = `
    mutation{
        Person(type: CREATE, input: {
        _id: "http://data/bluesB"
        name: {
            _value: "Adam"
            _type: Text
        }
        })
    }
    `

    const Query = `
    {
        Organization{
          _id
          employee{
            _id
            _type
            name{
              _value
            }
          }
           shareholder{
          __typename
          ...on Person{
            _id
            name{
              _value
            }
          }
        }   
        }
      }
    `

    test("Create Test", async () => {
        let result = await graphql(schema, CreateOrganizationQuery, null, null, null);
        result = await graphql(schema, CreatePersonQuery, null, null, null);
        result = await graphql(schema, Query, null, null, null);
        // Create
        const expected = {
            "data": {
              "Organization": [
                {
                  "_id": "http://subject",
                  "employee": [
                    {
                      "_id": ">http://data/bluesB",
                      "_type": [],
                      "name": {
                        "_value": "Adam"
                      }
                    }
                  ],
                  "shareholder": []
                }
              ]
            }
          }
        // {
        //     "data": {
        //       "Organization": [
        //         {
        //           "_id": "http://subject",
        //           "employee": {
        //             "_id": "http://data/bluesB",
        //             "_type": [
        //               "http://schema.org/Person"
        //             ],
        //             "name": [
        //               {
        //                 "_value": "Adam"
        //               }
        //             ]
        //           },
        //           "shareholder": [
        //             {
        //               "__typename": "Person",
        //               "_id": ">http://data/bluesB",
        //               "name": [
        //                 {
        //                   "_value": "Adam"
        //                 }
        //               ]
        //             }
        //           ]
        //         }
        //       ]
        //     }
        //   }
        expect(result).toEqual(expected);

    });



})

