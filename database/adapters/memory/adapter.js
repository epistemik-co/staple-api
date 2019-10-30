
const dataset_tree = require("graphy").util.dataset.tree;
const factory = require("@graphy/core.data.factory");
const databaseUtilities = require("../../database utilities/dataManagementUtilities/dataManagementUtilities");
const flatJsonGenerator = require("../../database utilities/flatJsonGenerator/flatjsonGenerator");
const appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class MemoryDatabase {
    constructor(schemaMapping) {
        this.updateSchemaMapping(schemaMapping);
        this.schemaMapping = schemaMapping;

        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";
 
        this.flatJsons = [];
        this.dbCallCounter = 0;

        logger.log("info", "Database is ready to use");
    }


    updateSchemaMapping(schemaMapping){
        databaseUtilities.createReverseContext(schemaMapping);
        databaseUtilities.createGraphMap(schemaMapping);
    }

    async loadCoreQueryDataFromDB(database, type, page = 1, filters = undefined, inferred = false) {
        // return everything
        return;
    }

    async loadChildObjectsByUris(database, sub, filter) {
        return;
    }
    
    
    // filters need to be implemented
    preparefilters(database, selection, tree, parentName) {
        return undefined;
    }
}