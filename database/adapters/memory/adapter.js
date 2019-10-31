
const dataset_tree = require("graphy").util.dataset.tree;
const factory = require("@graphy/core.data.factory");
// const databaseUtilities = require("../../database utilities/dataManagementUtilities/dataManagementUtilities");
// const flatJsonGenerator = require("../../database utilities/flatJsonGenerator/flatjsonGenerator");
const appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class MemoryDatabase {
    constructor(schemaMapping) { 
        this.schemaMapping = schemaMapping;

        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";

        this.flatJsons = [];
        this.dbCallCounter = 0;

        this.loadFakeData();
        logger.log("info", "Database is ready to use");
    }
 
    async loadCoreQueryDataFromDB(database, type, page = 1,  selectionSet = undefined, inferred = false, tree = undefined) {
        
        let data = [
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/employee" },
                object: { value: "http://sony.com/AkioMorita" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/employee" },
                object: { value: "http://sony.com/KenichiroYoshida" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/hasShareholder" },
                object: { value: "http://sony.com/AkioMorita" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/hasShareholder" },
                object: { value: "http://sony.com/MasaruIbuka" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/legalName" },
                object: { value: "Sony" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/noOfEmployees" },
                object: { value: "2" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
                object: { value: "http://schema.org/Organization" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Organization" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Thing" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://schema.org/affiliation" },
                object: { value: "http://sony.com" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://schema.org/name" },
                object: { value: "Akio Morita" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://schema.org/shareholderOf" },
                object: { value: "http://sony.com" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
                object: { value: "http://schema.org/Person" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Thing" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Person" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://schema.org/affiliation" },
                object: { value: "http://sony.com" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://schema.org/name" },
                object: { value: "Kenichiro Yoshida" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
                object: { value: "http://schema.org/Person" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Thing" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Person" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/MasaruIbuka" },
                predicate: { value: "http://schema.org/shareholderOf" },
                object: { value: "http://sony.com" },
                graph: { value: "null" }
            }];
 
        await data.forEach(quad => database.create(quad.subject.value, quad.predicate.value, quad.object.value)); 
        return;
    }

    async loadChildObjectsByUris(database, sub, selection, tree, parentName) {
        return;
    }

    // // filters need to be implemented
    // preparefilters(database, selection, tree, parentName) {
    //     return undefined;
    // }

    loadFakeData() {
        let data = [
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/employee" },
                object: { value: "http://sony.com/AkioMorita" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/employee" },
                object: { value: "http://sony.com/KenichiroYoshida" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/hasShareholder" },
                object: { value: "http://sony.com/AkioMorita" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/hasShareholder" },
                object: { value: "http://sony.com/MasaruIbuka" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/legalName" },
                object: { value: "Sony" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://schema.org/noOfEmployees" },
                object: { value: "2" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
                object: { value: "http://schema.org/Organization" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Organization" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Thing" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://schema.org/affiliation" },
                object: { value: "http://sony.com" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://schema.org/name" },
                object: { value: "Akio Morita" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://schema.org/shareholderOf" },
                object: { value: "http://sony.com" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
                object: { value: "http://schema.org/Person" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Thing" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/AkioMorita" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Person" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://schema.org/affiliation" },
                object: { value: "http://sony.com" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://schema.org/name" },
                object: { value: "Kenichiro Yoshida" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
                object: { value: "http://schema.org/Person" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Thing" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/KenichiroYoshida" },
                predicate: { value: "http://staple-api.org/datamodel/type" },
                object: { value: "http://schema.org/Person" },
                graph: { value: "null" }
            },
            {
                subject: { value: "http://sony.com/MasaruIbuka" },
                predicate: { value: "http://schema.org/shareholderOf" },
                object: { value: "http://sony.com" },
                graph: { value: "null" }
            }];

        data.forEach(quad => this.create(quad.subject.value, quad.predicate.value, quad.object.value));
    }

    create(sub, pred, obj, gra = null) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object") {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);

        let quad = factory.quad(sub, pred, obj, gra);
        this.database.add(quad);
        return true;
    }
}

module.exports = MemoryDatabase;