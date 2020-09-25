const logger = require("../../../../config/winston");
const jsonld = require("jsonld");
const fetch = require("node-fetch");

class SparqlAdapter {
    constructor(configFile) {
        this.configFile = configFile;
    }

    /**
     * 
     * Load Core Query Data From DB
     * 
     * @param {graphy} database - in-memory cache for results - graphy
     * @param {string} type uri
     * @param {int} page
     * @param {JSON} selectionSet
     * @param {boolean} inferred
     * @param {JSON} tree
     */

    async loadCoreQueryDataFromDB(database, type, page, selectionSet = undefined, inferred = false, tree = undefined, filter) {
        logger.info("loadCoreQueryDataFromDB in sparql was called");
        const fieldName = selectionSet.name.value;
        let subTypes = tree[fieldName]["subTypes"];
        subTypes = subTypes.map(t => (`<${t}>`)).join(", ");
        const filters = this.preparefilters(database, selectionSet, tree, filter);
        const headers = {
            "Content-Type": "application/sparql-query",
            "Accept": "application/n-triples"
        };

        let _type = type;
        let query = "";
        let graphName = this.configFile.graphName;
        if (inferred) {
            let typeForQuery;
            if (page !== undefined) {
                typeForQuery = `?x a ?type . filter (?type in (${subTypes})) } limit 10 offset ${10 * page - 10}}  ?x ?y ?z .`;
            } else {
                typeForQuery = `?x a ?type . filter (?type in (${subTypes})) } }  ?x ?y ?z .`;
            }
            if (filters) {
                if (graphName) {
                    query = `construct {?x ?y ?z} where { graph <${graphName}> {{select ?x where { ${filters.join(" ")} ${typeForQuery}}}`;
                } else {
                    query = `construct {?x ?y ?z} where {{select ?x where { ${filters.join(" ")} ${typeForQuery}}`;
                }
            } else {
                if (graphName) {
                    query = `construct {?x ?y ?z} where { graph <${graphName}> { {select ?x where { ${typeForQuery}}}`;
                } else {
                    query = `construct {?x ?y ?z} where { {select?x where { ${typeForQuery}}`;
                }
            }
        }
        else {
            let typeForQuery;
            if (page !== undefined) {
                typeForQuery = `?x a <${_type}> . }limit 10 offset ${10 * page - 10} } ?x ?y ?z .`;
            } else {
                typeForQuery = `?x a <${_type}> . } } ?x ?y ?z .`;
            }
            if (filters) {
                if (graphName) {
                    query = `construct {?x ?y ?z} where { graph <${graphName}> {{select ?x where { ${filters.join(" ")} ${typeForQuery}}}`;
                } else {
                    query = `construct {?x ?y ?z} where {{select ?x where { ${filters.join(" ")} ${typeForQuery}}`;
                }
            } else {
                if (graphName) {
                    query = `construct {?x ?y ?z} where { graph <${graphName}> {{select ?x where { ${typeForQuery}}}`;
                } else {
                    query = `construct {?x ?y ?z} where {{select ?x where { ${typeForQuery}}`;
                }
            }
        }

        logger.debug(`loadCoreQueryDataFromDB SPARQL query: ${query}`);
        const url = this.configFile.url + "?query=" + encodeURIComponent(equery);
        let response = undefined;
        try {
            response = await fetch(url, { method: "GET", headers: headers }).then(res => res.text());
        } catch (err) {
            throw Error("Could not fetch data from SPARQL");
        }
        try {
            if (!(response.includes("error"))) {
                await database.insertRDF(response);
            } else {
                logger.error("Failed to query endpoint.")
                logger.debug("Error response: ${response}")
            }
        } catch (err) {
            throw Error("Could not insert RDF into graphy");
        }

    }

    /**
     * Load child objects by URIs
     * @param {graphy} database - cache for results - graphy
     * @param {string[]} sub - list of child uris
     * @param {} selection
     * @param {JSON} tree
     * @param {} parentName type of parent
     */

    async loadChildObjectsByUris(database, sub, /*selection, tree, parentName*/) {
        const headers = {
            "Content-Type": "application/sparql-query",
            "Accept": "application/n-triples"
        };
        let query = "";
        let values = sub.map(s => ("<" + s + ">"));
        values = values.join(" ");
        let graphName = this.configFile.graphName;
        if (graphName) {
            query = `construct {?x ?y ?z} where { graph <${graphName}> { values ?x { ${values} } ?x ?y ?z}}`;
        } else {
            query = `construct {?x ?y ?z} where { values ?x { ${values} } ?x ?y ?z}`;
        }
        logger.debug(`loadChildObjectsByUris: SPARQL query: ${query}`);
        const url = this.configFile.url + "?query=" + query;
        logger.debug(`url for fetch: ${url}`);
        try {
            const response = await fetch(url, { method: "GET", headers: headers }).then(res => res.text());
            await database.insertRDF(response);
        } catch (err) {
            throw Error("Could not insert RDF in graphy");
        }
    }

    /**
     * 
     * push Object to backend is used when PUT mutation is called
     * 
     * @param  {graphy} database - cache for results
     * @param {JSON} input -  object to be PUT
     */

    async pushObjectToBackend(database, input) {
        let ID = input._id;
        const removeRes = await this.removeObject(database, [ID]);
        let graphName = this.configFile.graphName;
        const headers = {
            "Content-Type": "application/sparql-update",
        };
        if (removeRes){
        logger.info("pushObjectToBackend in sparql was called");

        input["@context"] = database.schemaMapping["@context2"];
        const rdf = await jsonld.toRDF(input, { format: "application/n-quads" });
        logger.debug(`pushObjectToBackend: RDF: ${rdf}`);
        let insert = "";
        if (graphName) {
            insert = `insert data { graph <${graphName}> { ${rdf}}}`;
        } else {
            insert = `insert data { ${rdf} }`;
        }

        try {
            await fetch(this.configFile.updateUrl, { method: "POST", headers: headers, body: insert }).then(res => res.text());
            return true;
        } catch (err) {
            throw Error("Could not push object to SPARQL");
        }}
    }

    /**
     * remove Object is called when DELETE muattion is called
     * @param {graphy} database - cache for results
     * @param {string[]} list of uris to be deleted
     */

    async removeObject(database, objectIDs) {
        let graphName = this.configFile.graphName;
        const headers = {
            "Content-Type": "application/sparql-update",
        };

        logger.info("removeObject in sparql was called");
        logger.debug(`removeObject: objectIDs: ${objectIDs}`);
        let values = objectIDs.map(id => ("<" + id + ">"));
        values = values.join(" ");
        let deleteQuery = "";
        if (graphName) {
            deleteQuery = `delete {graph <${graphName}> {?x ?y ?z}} where { graph <${graphName}> {values ?x {${values}} ?x ?y ?z .}}`;
        } else {
            deleteQuery = `delete {?x ?y ?z} where { values ?x {${values}} ?x ?y ?z .}`;
        }
        logger.debug(`removeObject: deleteQuery: ${deleteQuery}`);
        const url = this.configFile.updateUrl;
        try {
            await fetch(url, { method: "POST", headers: headers, body: deleteQuery }).then(res => res.text());
            return true;
        } catch (err) {
            throw Error("Could not remove object from SPARQL");
        }
    }

    /**
     * is Uri
     * @param  {string} str - stringto check if matches URI regex
     * @returns boolean
     */

    isURI(str) {
        var urlRegex = /\w+:(\/?\/?)[^\s]+/gm;
        var url = new RegExp(urlRegex, "i");
        return str.length < 2083 && url.test(str);
    }

    /**
     * Prepare filters
     * @param  {graphy} database - cache for results
     * @param {} selection
     * @param {JSON} tree
     * @returns {string} filters
     */

    preparefilters(database, selection, tree) {
        logger.debug(JSON.stringify(selection));
        let fieldName = selection.name.value;
        logger.debug(`preparefilters: ${fieldName}`);

        let fieldData = tree[fieldName];
        logger.debug(`preparefilters: ${fieldData}`);

        if (fieldData === undefined) {
            return {};
        }

        let filters = [];

        for (let argument of selection.arguments) {
            if (argument.value.fields) {
                for (let filterField of argument.value.fields) {
                    if (fieldData.data[filterField.name.value] !== undefined) {
                        let uri = fieldData.data[filterField.name.value].uri;
                        let variableForQuery = filterField.name.value;
                        let value = filterField.value;
                        let filterString = "";
                        if (uri === "@id") {
                            value = value.value.toString();
                            if (this.isURI(value)) {
                                value.replace("\"", "");
                                value = `<${value}>`;
                                filterString = `?x <${uri}> ?${variableForQuery} . filter (?${variableForQuery} in (${value}))`;
                            } else {
                                value = `"${value}"`;
                                filterString = `?x <${uri}> ?${variableForQuery} . filter (str(?${variableForQuery}) in (${value}))`;
                            }
                            filterString = `values ?x {${value}}`;
                            filters.push(filterString);
                        } else {
                            if (value.kind === "ListValue") {
                                value = value.values.map(x => (this.isURI(x.value.toString()) ?
                                    `<${x.value.toString()}>` : `"${x.value.toString()}"`));
                                value = value.join(", ");
                                filterString = `?x <${uri}> ?${variableForQuery} . filter (?${variableForQuery} in (${value})) .`;
                                filters.push(filterString);
                            } else if (value.kind === "IntValue" || value.kind === "FloatValue" || value.kind === "BooleanValue") {
                                filterString = `?x <${uri}> ?${variableForQuery} . filter (?${variableForQuery} in (${value.value.toString()})) .`;
                                filters.push(filterString);
                            } else {
                                value = [value.value.toString()];
                                if (this.isURI(value)) {
                                    value = `<${value}>`;
                                } else {
                                    value = `"${value}"`;
                                }
                                filterString = `?x <${uri}> ${value} .`;
                                filters.push(filterString);
                            }
                        }
                    }
                    else {
                        logger.debug("SKIP");
                    }
                }
            }
        }
        logger.debug(`prepareFilters: filters: ${JSON.stringify(filters)}`);
        if (Object.keys(filters).length === 0) {
            return undefined;
        }
        return filters;
    }
}

module.exports = SparqlAdapter;