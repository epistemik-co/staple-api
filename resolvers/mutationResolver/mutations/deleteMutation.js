function deleteMutation(database) {
    return async (args, req) => {
        const objectID = req.id;
        return await database.removeObject(objectID, req.source);
    };
}

module.exports = deleteMutation;