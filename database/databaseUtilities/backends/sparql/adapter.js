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
        const filters= this.preparefilters(database, selectionSet, tree)
        const headers = {
            "Content-Type" : "application/sparql-query",
            "Accept" : "application/n-triples"
        }

        let _type = type
        let query = "";
        //TODO: handle graphname
        let graphName = this.configFile.graphName
        if (inferred) {
            let typeForQuery = '?x <http://staple-api.org/datamodel/type> <' + _type + '> . ?x ?y ?z .'
            if (graphName){
                query = `construct {?x ?y ?z} where { graph <${graphName}> { ${typeForQuery}}}`; 
            }else{
                query = `construct {?x ?y ?z} where {${typeForQuery}}`; 
            }
        }
        else {
            let typeForQuery = `?x a <${_type}> . ?x ?y ?z .`;
            if (filters){
                if (graphName){
                    query = `construct {?x ?y ?z} where { graph <${graphName}> { ${filters.join(" ")} ${typeForQuery}}}`;
                }else{
                    query = `construct {?x ?y ?z} where { ${filters.join(" ")} ${typeForQuery}}`;
                }
            }else{
                if (graphName){
                    query = `construct {?x ?y ?z} where { graph <${graphName}> { ${typeForQuery}}}`;
                }else{
                    query = `construct {?x ?y ?z} where { ${typeForQuery}}`;
                }
            }
        }

        // console.log(query)

        const url = this.configFile.url + "?query=" + query
        // logger.debug(`loadCoreQueryDataFromDB: url: ${url}`);
        const response = await fetch(url, {method: 'GET', headers: headers}).then(res => res.text());
        // logger.debug(`loadCoreQueryDataFromDB: fetch response: ${response}`);

        // logger.debug("Graphy database rdf insert start");
        await database.insertRDF(response);
        // logger.debug("Graphy database rdf insert end");

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
            "Accept" : "application/n-triples"
        }

        let query = "";
        let values = sub.map(s => ("<" + s + ">"))
        values = values.join(" ");
        query = `construct {?x ?y ?z} where { values ?x {` + values + `} ?x ?y ?z}`;
        const url = this.configFile.url + "?query=" + query
        logger.debug(`url for fetch: ${url}`);
        const response = await fetch(url, {method: 'GET', headers: headers}).then(res => res.text());
        // logger.debug(`fetch response: ${response}`);

        logger.debug("Graphy database rdf insert start");
        await database.insertRDF(response);
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
        }

        logger.info("pushObjectToBackend in sparql was called")

        input["@context"] = database.schemaMapping["@context2"];
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
     * is Uri
     * @param  {str} string to check if matches URI regex
     * @returns boolean
     */

    isURI(str) {
        var urlRegex = /\w+:(\/?\/?)[^\s]+/gm;
        var url = new RegExp(urlRegex, 'i');
        return str.length < 2083 && url.test(str);
   }

    /**
     * Prepare filters
     * @param  {database} cache for results - graphy
     * @param {selection} 
     * @param {tree} 
     * @returns {query}
     */

    preparefilters(database, selection, tree) {
        logger.debug(JSON.stringify(selection))
        let query = {};
        let fieldName = selection.name.value;
        logger.debug(`preparefilters: ${fieldName}`)

        let fieldData = tree[fieldName];
        logger.debug(`preparefilters: ${fieldData}`)

        if (fieldData === undefined) {
            return {};
        }

        let filters = [];

        for (let argument of selection.arguments) {
            if (argument.name.value === "filter") {
                for (let filterField of argument.value.fields) {
                    if (fieldData.data[filterField.name.value] !== undefined) {
                        // logger.debug("ADD TO THE FILTER QUERY");
                        // logger.debug(JSON.stringify(fieldData.data[filterField.name.value]));
                        // logger.debug(`prepareFilters: ${fieldData.data[filterField.name.value].uri}`)
                        let uri = fieldData.data[filterField.name.value].uri;
                        let value = filterField.value;
                        let filterString= "";
                        if (uri === "@id"){
                            value = value.value.toString()
                            if (this.isURI(value)){
                                value.replace("\"", "")
                                value = `<${value}>`
                            }else{
                                value = `"${value}"`
                            }
                            filterString = `values ?x {${value}}`
                            filters.push(filterString)
                        }else{
                            if (value.kind === "ListValue") {
                                value = value.values.map(x => (this.isURI(x.value.toString()) ?
                                    `<${x.value.toString()}>`: `"${x.value.toString()}"`));
                                value = value.join(", ")
                                filterString = `?x <${uri}> ?p . filter (?p in (${value})) .` 
                                filters.push(filterString)
                            } else if (value.kind === "IntValue" || value.kind === "FloatValue" || value.kind === "BooleanValue" ) {
                                filterString = `?x <${uri}> ?p . filter (?p in (${value.value.toString()})) .` 
                                filters.push(filterString)
                            } else {
                                value = [value.value.toString()];
                                if (this.isURI(value)){
                                    value = `<${value}>`
                                }else{
                                    value = `"${value}"`
                                }
                                filterString  = `?x <${uri}> ${value} .`
                                filters.push(filterString)
                            }
                        }
                    }
                    else {
                        console.log("SKIP");
                    }
                }
            }
        }
        logger.debug(`prepareFilters: filters ${JSON.stringify(filters)}`)
        if (Object.keys(filters).length === 0) {
            return undefined;
        }
        return filters;
    }
}

module.exports = SparqlAdapter;