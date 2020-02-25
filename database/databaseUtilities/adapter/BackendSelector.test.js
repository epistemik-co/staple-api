const BackendSelector = require("./BackendSelector");

beforeEach(()=>{
    const obj = new BackendSelector({
        "_id": "@id",
        "_type": "@type",
        "Agent": "http://example.com/Agent",
        "name": "http://example.com/name",
      });
})

it ('BackendSelectorConstructor', () => {
    const obj = new BackendSelector({
        "_id": "@id",
        "_type": "@type",
        "Agent": "http://example.com/Agent",
        "name": "http://example.com/name",
      });
    expect(obj.backend).toHaveProperty('database');
});

it ('BackendSelectorloadCoreQueryDataFromDB', (database, type, page = undefined, selectionSet = undefined, inferred = false, tree = undefined)=> {
    const obj = new BackendSelector({
        "_id": "@id",
        "_type": "@type",
        "Agent": "http://example.com/Agent",
        "name": "http://example.com/name",
      });
    expect(obj.loadCoreQueryDataFromDB("database", "type", page = undefined, selectionSet = undefined, inferred = false, tree = undefined)).toBeDefined();
});