
let handleDataTypeResolver = (tree, object, schemaMapping) => {
    let newResolverBody = {};


    for (var propertyName in tree[object].data) {
        if (propertyName === "_value") {
            newResolverBody["_value"] = async (parent) => { if (parent.value === undefined) return parent; return parent.value; };
        }
        else if (propertyName === "_type") {
            newResolverBody["_type"] = (parent) => {

                let types = ["http://schema.org/Text"];
                if (parent.datatype !== undefined) {
                    types = [parent.datatype.value];
                }

                types = types.map(x => {
                    for (let key in schemaMapping["@context"]) {
                        if (schemaMapping["@context"][key] === x)
                            return key;
                    }
                    return "";
                });

                return types;
            };
        }
    }

    return newResolverBody;
};

module.exports = handleDataTypeResolver;