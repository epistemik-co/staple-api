
const dataset_tree = require("graphy").util.dataset.tree;
const factory = require("@graphy/core.data.factory");
// const databaseUtilities = require("../../database utilities/dataManagementUtilities/dataManagementUtilities"); 
const appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const databaseUtilities = require("./Utilities");
const jsonld = require("jsonld"); 

// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class MemoryDatabase {
    constructor(schemaMapping) {
        this.schemaMapping = schemaMapping;

        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";

        this.flatJsons = [];
        this.dbCallCounter = 0;

        // this.loadFakeData();
        logger.log("info", "Database is ready to use");
    }

    async loadCoreQueryDataFromDB(database, type, page = 1, selection = undefined, inferred = false, tree = undefined) {
        // search selectionSet for core objects load them
        // console.log(selectionSet);
        let fieldName = selection.name.value;
        let fieldData = tree[fieldName];

        if (fieldName === undefined) {
            logger.error("Could not find type of object");
            return undefined;
        }

        // all ids
        let ids = await this.getSubjectsByType(type, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", inferred, page);

        // filter
        //  id filter
        console.log("START FILTERS");
        if (fieldData) {
            for (let argument of selection.arguments) {
                if (argument.name.value === "filter") {
                    for (let filterField of argument.value.fields) {
                        console.log("OBJECT");
                        console.log(filterField);
                        console.log("\n\n");
                        if (fieldData.data[filterField.name.value] !== undefined) {
                            console.log("ADD TO THE FILTER QUERY");
                            console.log(fieldData.data[filterField.name.value]);
                            let uri = fieldData.data[filterField.name.value].uri;
                            let value = filterField.value;
                            if(uri === "@id"){
                                console.log(value);
                                if(value.kind === "ListValue"){
                                    value = value.values.map(x => x.value);
                                }
                                else{
                                    value = [value.value];
                                }
                                console.log(value);
                                ids = ids.filter( x => value.includes(x));
                            }
                        }
                        else {
                            console.log("SKIP");
                        }
                    }
                }
            }
        }
        else {
            logger.warn("Could not find object data for filters");
        }

        // Add to graphy 
        for (let sub of ids) {
            sub = factory.namedNode(sub);

            const temp = this.database.match(sub, null, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                database.database.add(x.value);
                x = itr.next();
            }
        }
        // console.log(util.inspect(selection, false, null, true));

        return;
    }

    async loadChildObjectsByUris(database, sub, selection, tree, parentName) {
        // search selectionSet for core objects load them
        let fieldName = selection.name.value;
        // let fieldData = tree[fieldName];

        if (fieldName === undefined) {
            logger.error("Could not find type of object");
            return undefined;
        }

        for (let subject of sub) {
            subject = factory.namedNode(subject);
            const temp = this.database.match(subject, null, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                database.database.add(x.value);
                x = itr.next();
            }
        }

        return;
    }

    async loadObjectsByUris(database, sub) {
        // search selectionSet for core objects load them

        for (let subject of sub) {
            subject = factory.namedNode(subject);
            const temp = this.database.match(subject, null, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                database.database.add(x.value);
                x = itr.next();
            }
        }

        return;
    }

    async pushObjectToBackend(database, input) {
        input["@context"] = database.schemaMapping["@context"];
        const rdf = await jsonld.toRDF(input, { format: "application/n-quads" });
        await this.insertRDF(rdf);

        // console.log("\n\n\n");
        // console.log("DATABASE SHOULD CONTAIN DATA NOW");
        // console.log(this.getAllQuads());
        // console.log("\n\n\n");
        return;
    }
    // // filters need to be implemented
    // preparefilters(database, selection, tree, parentName) {
    //     return undefined;
    // }


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

    // returns array of uri - Core Query
    async getSubjectsByType(type, predicate, inferred = false, page) {
        type = factory.namedNode(type);
        let i = 0;

        if (inferred) {
            predicate = factory.namedNode(this.stampleDataType);
        }
        else {
            predicate = factory.namedNode(predicate);
        }

        const temp = this.database.match(null, predicate, type);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            i++;
            if (i > (page - 1) * 10) {
                data.push(x.value.subject.value);
            }
            if (i + 1 > page * 10) {
                break;
            }
            x = itr.next();
        }


        return data;
    }

    async insertRDF(rdf, tryToFix = false, uuid = undefined) {
        await databaseUtilities.insertRDFPromise(this.database, rdf, this.schemaMapping, tryToFix, uuid);
        databaseUtilities.updateInference(this);
    }

    async removeRDF(rdf, ID) {
        await databaseUtilities.removeRDFPromise(this.database, ID, rdf);
        databaseUtilities.updateInference(this);
    }

    // returns all quads
    getAllQuads() {
        const temp = this.database.match(null, null, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
            x = itr.next();
        }
        return data;
    }

}

module.exports = MemoryDatabase;
