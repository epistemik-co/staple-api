const read_graphy = require('graphy').content.nt.read;
const dataset_tree = require('graphy').util.dataset.tree
const factory = require('@graphy/core.data.factory');


// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class Database {
    constructor() {
        this.y_tree = dataset_tree();
    }

    // ---
    create(sub, pred, obj, gra = null) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object") {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);

        let quad = factory.quad(sub, pred, obj, gra);

        this.y_tree.add(quad);
        return true;
    }

    // ---  
    delete(sub, pred, obj, gra = null) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object" && obj !== undefined) {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);

        // remove all objects of specyfic type
        if (obj === undefined) {
            const temp = this.y_tree.match(sub, pred, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                this.y_tree.delete(x.value);
                x = itr.next();
            }
        }
        // remove one specyfic object of specyfic type
        else {
            let quad = factory.quad(sub, pred, obj, gra)
            this.y_tree.delete(quad);
        }
    }

    // returns boolean 
    deleteID(id) {
        id = factory.namedNode(id);

        let removed = false;
        var temp = this.y_tree.match(id, null, null);
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            this.y_tree.delete(x.value);
            removed = true;
            x = itr.next();
        }

        temp = this.y_tree.match(null, null, id);
        itr = temp.quads();
        x = itr.next();
        while (!x.done) {
            this.y_tree.delete(x.value);
            removed = true;
            x = itr.next();
        }
        return removed;
    }

    // Array of uri
    getObjectsValueArray(sub, pred) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.y_tree.match(sub, pred, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value.object.value);
            x = itr.next();
        }
        return data;
    };

    // Array of uri
    isTripleInDB(sub, pred, obj, gra = null) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object" && obj !== undefined) {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);


        let quad = factory.quad(sub, pred, obj, gra);

        return this.y_tree.has(quad)
    };


    // Array of Quads
    getTriplesBySubject(sub) {

        sub = factory.namedNode(sub);

        const temp = this.y_tree.match(sub, null, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
            x = itr.next();
        }
        return data;
    };


    // returns single object value - uri or data
    getSingleStringValue(sub, pred) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.y_tree.match(sub, pred, null);
        var itr = temp.quads();
        var x = itr.next();

        return x.value.object.value;
    };



    // returns single object value - data
    getSingleLiteral(sub, pred) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.y_tree.match(sub, pred, null);
        var itr = temp.quads();
        var x = itr.next();

        return x.value.object;
    };

    // returns array of uri
    getSubjectsByType(type, predicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {

        type = factory.namedNode(type);
        predicate = factory.namedNode(predicate);
        const temp = this.y_tree.match(null, predicate, type);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value.subject.value);
            x = itr.next();
        }
        return data;
    };

    getAllQuads() {
        const temp = this.y_tree.match(null, null, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
            x = itr.next();
        }
        return data;
    };

    drop() {
        this.y_tree.clear();
    }


    insertRDF(rdf, ID) {
        //console.log(`inserting rdf data`)
        const constr = (tree, ID) => {
            let data = (y_quad) => {
                if (y_quad.subject.value === ID) {
                    if (y_quad.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                        y_quad.predicate.value = "http://www.w3.org/1999/02/22-rdf-syntax-ns#staple:type"
                    }

                    tree.add(y_quad);

                }
            }

            let eof = (h_prefixes) => {
                //console.log("Done");
            }

            read_graphy(rdf, { data, eof, })
        }

        constr(this.y_tree, ID);
    }

    removeRDF(rdf, ID) {
        //console.log(`removing rdf data`);
        const constr = (tree, ID) => {
            let data = (y_quad) => {
                if (y_quad.subject.value === ID) {
                    if (y_quad.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                        y_quad.predicate.value = "http://www.w3.org/1999/02/22-rdf-syntax-ns#staple:type"
                    }
                    
                    tree.delete(y_quad);
                }
            }

            let eof = (h_prefixes) => {
                //console.log("Done");
            }

            read_graphy(rdf, { data, eof, })
        }

        constr(this.y_tree, ID);
    }

}

module.exports = Database