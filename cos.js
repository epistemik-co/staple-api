//NEW IMPORTS
var { GraphQLSchema } = require('graphql');
//OLD IMPORTS
const {
    printSchema,
    buildClientSchema
} = require("graphql");
var { buildSchema } = require('graphql');
var express = require('express');
var graphqlHTTP = require('express-graphql');
var graphql = require('graphql');
const util = require('util')

async function main() {
    let gqlObjects = {};
    // Wersja I
    // ta wersja działa
    var classList = [
        { "name": "Person", "fields": { "affiliation": { "type": "Organization" } } },
        { "name": "Organization", "fields": { "employee": { "type": "Person" } } }
    ];

    const getFields = (object) => {
        return () => {

            let fields = {};
            for (let fieldName in object.fields) {

                let filedType = object.fields[fieldName]["type"];
                fields[fieldName] = {
                    type: gqlObjects[filedType]
                };
            }
            return fields;
        };
    };

    for (let i = 0; i < 2; i++) {
        if (i == 0) {
            gqlObjects[classList[i].name] = new graphql.GraphQLObjectType({
                name: classList[i].name,
                fields: getFields(classList[i])
            });
        }
        else if (i == 1) {
            gqlObjects[classList[i].name] = new graphql.GraphQLObjectType({
                name: classList[i].name,
                fields: getFields(classList[i])
            });
        }
    }

    console.log(gqlObjects);
    // gqlObjects = {};
    // Wersja II
    // ta wersja tworzy bledna Scheme gdzie oba typy
    // Person i Organization mają jedno i to samo pola employee: Person
    // powodem tego jest najpewniej sposób w jaki zmienne są traktowane w kolejnych iteracjach w JS i gdzieś nadpisywane
    // var classList = [
    //     { "name": "Person", "fields": { "affiliation": { "type": "Organization" } } },
    //     { "name": "Organization", "fields": { "employee": { "type": "Person" } } }
    // ];

    // classList.forEach(c => {
    //     var fields = {}
    //     for (f in c["fields"]) {
    //         var t = c["fields"][f]["type"]

    //         console.log(f)
    //         console.log(t)
    //         console.log(gqlObjects[t])
    //         fields[f] = {
    //             type: gqlObjects[t]
    //         }
    //     }

    //     gqlObjects[c.name] = new graphql.GraphQLObjectType({
    //         name: c.name,
    //         fields: () => (fields)
    //     });

    // })

    // const constr = (className, fields) => {
    //     return new graphql.GraphQLObjectType({
    //         name: className,
    //         fields: () => (fields)
    //     });
    // };


    // //fill

    // for (let className in classList) {
    //     var fields = {};
    //     for (let fieldName in classList[className]["fields"]) {
    //         var t = classList[className]["fields"][fieldName]["type"];

    //         if(gqlObjects[t] === undefined){
    //             gqlObjects[t] = { 
    //                 value: {}
    //             };
    //         }
    //         fields[fieldName] = {
    //             type: gqlObjects[t].value
    //         };

    //     }
    //     if(gqlObjects[className] === undefined){
    //         gqlObjects[className] = {};
    //     }
    //     gqlObjects[className].value = constr(className, fields);
    // }

    // //final object

    // console.log(gqlObjects);
    // let newgqlObjects = {};
    // for (let className in classList) {
    //     fields = {};
    //     for (let fieldName in classList[className]["fields"]) {
    //         t = classList[className]["fields"][fieldName]["type"];

    //         fields[fieldName] = {
    //             type: gqlObjects[t].value
    //         };

    //     }
    //     newgqlObjects[className] = await constr(className, fields);
    // }

    console.log(gqlObjects)

    //  fixed queries nad GraphQL server
    var queryType = {
        name: 'Query',
        fields: {
            "getOrgs": {
                type: graphql.GraphQLList(gqlObjects["Organization"])
            },
            "getPeople": {
                type: graphql.GraphQLList(gqlObjects["Person"])
            }
        }
    };

    queryType = new graphql.GraphQLObjectType(queryType)
    var schema = new graphql.GraphQLSchema({ query: queryType });
    var app = express();
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        graphiql: true,
    }));
    app.listen(4000);
    console.log('Running a GraphQL API server at localhost:4000/graphql');
}

main()