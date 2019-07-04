
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



describe('My Test Cases for mutation resolvers', () => {
    const CreateQuery = `
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
                _id: "http://johnnyB"
            }
            shareholder:{
                _type: Person
                    _id: "http://data/bluesB"
                _value: "20"
            }
            noOfEmployees: {
                _type: Integer
                _value: "0"
            }
            })
        }
    `;

    const UpdateQuery = `
    mutation{
        Organization(type: UPDATE, input: {
          _id: "http://subject"
          _type: Organization
          legalName: {
            _value: "Firma"
            _type: Text
          }
          employee: {
            _type: Person
            _id: "http://johnnyB2"
          }
          noOfEmployees: {
            _type: Integer
            _value: "1"
          }
        })
      }
    `

    const RemoveQuery = `
    mutation{
        Organization(type: REMOVE, input: {
          _id: "http://subject"
          legalName: {
            _value: "Nazwa firmy"
            _type:	Text
          }
          noOfEmployees: {
            _type: Integer
            _value: "0"
          }
        employee: {
            _type: Person
            _id: "http://johnnyB"
          }
        })
      }
    `

    const InsertQuery = `
    mutation{
        Organization(type: INSERT, input: {
            _id: "http://subject"
          legalName: {
            _value: "Adam"
            _type: Text
          }
        })
      }
    `

    const DeleteQuery = `
    mutation {
        DELETE(id: "http://subject" )
    }
  `

    test("Create Test", async () => {
        const result = await graphql(schema, CreateQuery, null, null, null);
        // Create
        expect(result.data.Organization).toEqual(true);
        // Count Triples
        let data = database.getTriplesBySubject("http://subject");
        expect(data.length).toEqual(5);
        // ID Type test
        data = database.getSingleStringValue("http://subject", "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
        expect(data).toEqual(schemaMapping["@context"]["Organization"]);
        // Object test
        data = database.getSingleStringValue("http://subject", "http://schema.org/employee");
        expect(data).toEqual("http://johnnyB");
        // Data test
        data = database.getSingleLiteral("http://subject", "http://schema.org/noOfEmployees");
        expect(data.value).toEqual("0");
        // Data test text
        data = database.getSingleStringValue("http://subject", "http://schema.org/legalName");
        expect(data).toEqual("Nazwa firmy");
        // Union test
        data = database.getSingleStringValue("http://subject", "http://schema.org/shareholder");
        expect(data).toEqual("http://data/bluesB");
    });


    test("Update Test", async () => {
        let result = await graphql(schema, CreateQuery, null, null, null);
        result = await graphql(schema, UpdateQuery, null, null, null);

        // Update
        expect(result.data.Organization).toEqual(true);
        // Count Triples
        let data = database.getTriplesBySubject("http://subject");
        expect(data.length).toEqual(4);
        // Object test
        data = database.getSingleStringValue("http://subject", "http://schema.org/employee");
        expect(data).toEqual("http://johnnyB2");
        // Data test int
        data = database.getSingleLiteral("http://subject", "http://schema.org/noOfEmployees");
        expect(data.value).toEqual("10");
        // Data test text
        data = database.getSingleStringValue("http://subject", "http://schema.org/legalName");
        expect(data).toEqual("Firma");
    });


    test("Remove Test", async () => {
        let result = await graphql(schema, CreateQuery, null, null, null);
        result = await graphql(schema, RemoveQuery, null, null, null);

        // Update
        expect(result.data.Organization).toEqual(true);
        // Count Triples
        let data = database.getTriplesBySubject("http://subject");
        expect(data.length).toEqual(2);
        // 
        data = database.getSingleStringValue("http://subject", "http://schema.org/shareholder");
        expect(data).toEqual("http://data/bluesB");
    });


    test("Insert Test", async () => {
        let result = await graphql(schema, CreateQuery, null, null, null);
        let RemoveQuery = `
        mutation{
            Organization(type: REMOVE, input: {
              _id: "http://subject"
              legalName: {
                _value: "Nazwa firmy"
                _type:	Text
              }
            })
          }
        `
        result = await graphql(schema, RemoveQuery, null, null, null);
        result = await graphql(schema, InsertQuery, null, null, null);

        // Update
        expect(result.data.Organization).toEqual(true);
        // Count Triples
        let data = database.getTriplesBySubject("http://subject");
        expect(data.length).toEqual(5);
        // 
        data = database.getSingleStringValue("http://subject", "http://schema.org/legalName");
        expect(data).toEqual("Adam");
    });


    test("Delete Test", async () => {
        let result = await graphql(schema, CreateQuery, null, null, null);
        result = await graphql(schema, DeleteQuery, null, null, null);
        
        // Update
        expect(result.data.DELETE).toEqual(true);
        // Count Triples
        let data = database.getTriplesBySubject("http://subject");
        expect(data.length).toEqual(0);
    });
})

