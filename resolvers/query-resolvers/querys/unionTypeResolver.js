let handleUnionTypeResolver = (tree, object, database, schemaMapping) => {
    let newResolverBody = {};

    let constr = (name) => {
        return async (parent) => {


            let typesOfObject = tree[name].values.map(value => {
                let uriToName = {};
                uriToName[schemaMapping["@context"][value]] = value;

                return uriToName;
            });


            let typeOfInspectedObject = await database.getObjectsValueArray(parent, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
            typeOfInspectedObject = typeOfInspectedObject[0];


            let searchedTypes = typesOfObject.filter(x => x[typeOfInspectedObject] !== undefined)[0];

            // Could not find exact type
            if (searchedTypes === undefined) {
                //look for infered types
                let inferedTypes = [];
                // let data = schemaMapping["@graph"].filter((x) => { return x['@id'] === typeOfInspectedObject });
                let data = schemaMapping["@graphMap"][typeOfInspectedObject];
                if (data !== undefined) {
                    let uris = data["http://www.w3.org/2000/01/rdf-schema#subClassOf"];
                    for (let x in uris) {
                        inferedTypes.push(uris[x]["@id"]);
                    }
                }



                for (let key in inferedTypes) {
                    for (let i in typesOfObject) {
                        for (let key2 in typesOfObject[i]) {
                            if (key2 === inferedTypes[key]) {
                                return typesOfObject[i][key2];
                            }
                        }
                    }
                }
            }
            typesOfObject = typesOfObject.filter(x => x[typeOfInspectedObject] !== undefined)[0];
            if (typesOfObject === undefined) {
                let possibleTypes = name.split("_");
                if (possibleTypes.includes("Text")) {
                    return "Text";
                }
                return possibleTypes[0];
            }
            return typesOfObject[typeOfInspectedObject];
        };

    };

    newResolverBody["__resolveType"] = constr(object);
    return newResolverBody;
};

module.exports = handleUnionTypeResolver;