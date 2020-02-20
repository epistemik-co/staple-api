const logger = require("../../../../config/winston");
const jsonld = require("jsonld");
const util = require("util");
const fetch = require('node-fetch');

class SparqlAdapter {
    constructor(configFile) {
        this.configFile = configFile;
    }

    /**
     * Load Core Query Data From DB
     * @param  {database} in-memory cache for results - graphy
     * @param {type} type uri
     * @param {page} 
     * @param {selectionSet}
     * @param {inferred} DONE
     * @param {tree} 
     */

    async loadCoreQueryDataFromDB(database, type, page = 1, selectionSet = undefined, inferred = false, tree = undefined) {
        logger.info("loadCoreQueryDataFromDB in sparql was called")

        const headers = {
            "Content-Type" : "application/sparql-query",
            "Accept" : "application/ld+json"
        }

        let _type = type
        let query = "";

        if (inferred) {
            let typeForQuery = '?x <http://staple-api.org/datamodel/type> <' + _type + '> . ?x ?y ?z .'
            query = `construct {?x ?y ?z} where {` + typeForQuery + `}`; 
        }
        else {
            let typeForQuery = '?x a <' + _type + '> . ?x ?y ?z .'
            query = `construct {?x ?y ?z} where {` + typeForQuery + `}`;
        }

        const url = this.configFile.url + "?query=" + query
        logger.debug(`loadCoreQueryDataFromDB: url: ${url}`);
        const response = await fetch(url, {method: 'GET', headers: headers}).then(res => res.json());
        logger.debug(`loadCoreQueryDataFromDB: fetch response: ${JSON.stringify(response)}`);

        const rdf = await jsonld.toRDF(response, { format: "application/n-quads" });
        logger.debug("Graphy database rdf insert start");
        await database.insertRDF(rdf);
        logger.debug("Graphy database rdf insert end");

    }

    /**
     * Load child objects by URIs
     * @param  {database} cache for results - graphy
     * @param {sub} list of child uris
     * @param {selection} TODO - filters
     * @param {tree}
     * @param {parentName} type of parent
     */

    async loadChildObjectsByUris(database, sub, selection, tree, parentName) {

        const headers = {
            "Content-Type" : "application/sparql-query",
            "Accept" : "application/ld+json"
        }

        let query = "";

        let values = sub.map(s => ("<" + s + ">"))
        values = values.join(" ");
        console.log(values)
        query = `construct {?x ?y ?z} where { values ?x {` + values + `} ?x ?y ?z}`;

        const url = this.configFile.url + "?query=" + query
        logger.debug(`url for fetch: ${url}`);
        const response = await fetch(url, {method: 'GET', headers: headers}).then(res => res.json());
        logger.debug(`fetch response: ${JSON.stringify(response)}`);

        const rdf = await jsonld.toRDF(response, { format: "application/n-quads" });
        logger.debug(`RDF: ${rdf}`)
        logger.debug("Graphy database rdf insert start");
        await database.insertRDF(rdf);
        logger.debug("Graphy database rdf insert end");

    }

    /**
     * push Object to backend is used when PUT mutation is called
     * @param  {database} cache for results - graphy
     * @param {input} JSON of object to be PUT
     */

    async pushObjectToBackend(database, input) {
        const headers = {
            "Content-Type" : "application/sparql-update",
            "Accept" : "application/ld+json"
        }

        logger.info("pushObjectToBackend in sparql was called")

        input["@context"] = database.schemaMapping["@context"];
        const rdf = await jsonld.toRDF(input, { format: "application/n-quads" });
        logger.debug(`pushObjectToBackend: RDF: ${rdf}`);
        let insert = "insert data { " + rdf + "}" 

        const url = this.configFile.updateUrl
        logger.debug(`url for fetch: ${url}`);
        await fetch(url, {method: 'POST', headers: headers, body: insert}).then(res => res.text());
    }

    /**
     * remove Object is called when DELETE muattion is called
     * @param  {database} cache for results - graphy
     * @param {objectIDs} list of uris to be deleted
     */

    async removeObject(database, objectIDs) {
        const headers = {
            "Content-Type" : "application/sparql-update",
            "Accept" : "application/ld+json"
        }

        logger.info("removeObject in sparql was called")
        logger.debug(`removeObject: objectIDs: ${objectIDs}`);
        let values = objectIDs.map(id => ("<" + id + ">"));
        values = values.join(" ");
        
        let deleteQuery = `delete {?x ?y ?z} where { values ?x {${values}} ?x ?y ?z .}`
        logger.debug(`removeObject: deleteQuery: ${deleteQuery}`)
        const url = this.configFile.updateUrl
        logger.debug(`url for fetch: ${url}`);
        const response = await fetch(url, {method: 'POST', headers: headers, body: deleteQuery}).then(res => res.text());
        logger.debug(`fetch response: ${JSON.stringify(response)}`);
    }

    /**
     * Prepare filters
     * @param  {database} cache for results - graphy
     * @param {selection} 
     * @param {tree} 
     * @returns {query}
     */

    preparefilters(database, selection, tree) {
        // console.log(util.inspect(selection,false,null,true)) 
        let query = {};
        let fieldName = selection.name.value;
        let fieldData = tree[fieldName];

        if (fieldData === undefined) {
            return {};
        }

        for (let argument of selection.arguments) {
            if (argument.name.value === "filter") {
                for (let filterField of argument.value.fields) {
                    // console.log("OBJECT");
                    // console.log(filterField);
                    // console.log("\n\n");
                    if (fieldData.data[filterField.name.value] !== undefined) {
                        // console.log("ADD TO THE FILTER QUERY");
                        if (filterField.value.kind === "ListValue") {
                            let objectFilterName = filterField.name.value;

                            query[objectFilterName] = {};
                            query[objectFilterName]["$in"] = [];

                            for (let elem of filterField.value.values) {
                                if (elem.kind === "IntValue") {
                                    query[objectFilterName]["$in"].push(parseInt(elem.value));
                                }
                                else if (elem.kind === "FloatValue") {
                                    query[objectFilterName]["$in"].push(parseFloat(elem.value));
                                }
                                else {
                                    query[objectFilterName]["$in"].push(elem.value);
                                }
                            }
                        }
                        else {
                            if (filterField.value.kind === "IntValue") {
                                query[filterField.name.value] = parseInt(filterField.value.value);
                            }
                            else if (filterField.value.kind === "FloatValue") {
                                query[filterField.name.value] = parseFloat(filterField.value.value);
                            }
                            else {
                                query[filterField.name.value] = filterField.value.value;
                            }
                        }
                    }
                    else {
                        logger.debug("SKIP");
                    }
                }
            }
        }

        if (Object.keys(query).length === 0 && query.constructor === Object) {
            return undefined;
        }
        return query;
    }
}

module.exports = SparqlAdapter;