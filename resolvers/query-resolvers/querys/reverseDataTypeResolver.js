
let handleReverseDataTypeResolver = (tree, object) => {
    let newResolverBody = {};

    for (var propertyName in tree[object].data) {
        let uri = tree[object].data[propertyName].data.uri;

        let constr = (name) => {
            return ((parent) => {
                parent = parent.filter(x => x.predicate.value === name);
                let data = parent.map(x => x.subject.value);
                return data;
            });
        };

        newResolverBody[propertyName] = constr(uri);
    }
    return newResolverBody;
};

module.exports = handleReverseDataTypeResolver;