const { GraphQLError } = require("graphql");

const validate = (req, schemaMapping, tree, field) => {
    // let type = req.type;
    let input = req.input;
    let objectName = field.name.value;
    let objectProps = tree[objectName].data;
    
    let objectID = input["_id"];
    validateURI(objectID, "_id");

    for(let property in input){
        if (property !== "_id" && property !== "_type") {
            // is property a class type?  
            if(tree[objectProps[property].name] && tree[objectProps[property].name ].type === "http://www.w3.org/2000/01/rdf-schema#Class"){
                validateURI(input[property], property);
            }
        }
    }
    
    return true;
};

// const validateIsIterable = (obj) => {
//     // checks for null and undefined
//     if (obj == null) {
//         return false;
//     }
//     return typeof obj[Symbol.iterator] === "function";
// };

const validateURI = (uri, name) => {
    if (uri === undefined) {
        throw new GraphQLError({ key: "ERROR", message: `Uri for ${name} is not defined in context` });
    }
    // eslint-disable-next-line no-useless-escape
    var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if (!pattern.test(uri)) {
        // throw new ApolloError("message", "code", "code");
        console.log(uri);
        throw new GraphQLError({ key: "ERROR", message: `The value of ${name} keys in the object are not valid URIs` });
    }
};


module.exports = { 
    validate: validate
};