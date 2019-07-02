const read_graphy = require('graphy').content.nt.read;
const dataset_tree = require('graphy').util.dataset.tree
const factory = require('@graphy/core.data.factory');

class Database {
    constructor() {
        this.y_tree = dataset_tree();
    }



    create(sub, pred, obj, gra = null) {
        let quad = factory.quad(sub, pred, obj, gra);

        const iterable1 = new Object();
        iterable1[Symbol.iterator] = function* () {
            yield quad;
        };

        // console.log(this.y_tree.has(quad));
        // console.log(this.y_tree.size);
        this.y_tree.addQuads([...iterable1]);
        // console.log(this.y_tree.size);
        console.log(this.getAllQuads())
    }


    read(rdf) {
        let y_tree2 = this.y_tree
        read_graphy(rdf, {
            data(y_quad) {
                y_tree2.add(y_quad)
            },
            eof(h_prefixes) {
                this.y_tree = y_tree2
            },
        })
    }


    delete(sub, pred, obj, gra = null) {
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


    deleteID(id) {
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


    getObjs(sub, pred) {
        const temp = this.y_tree.match(factory.namedNode(sub), factory.namedNode(pred), null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value.object.value);
            x = itr.next();
        }
        return data;
    };

    getTriplesBySubject(sub) {
        const temp = this.y_tree.match(factory.namedNode(sub), null, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
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


    getSingleStringValue(sub, pred) {
        const temp = this.y_tree.match(factory.namedNode(sub), factory.namedNode(pred), null);
        var itr = temp.quads();
        var x = itr.next();
        return x.value.object.value;
    };


    async getSingleLiteral(sub, pred) {
        const temp = this.y_tree.match(factory.namedNode(sub), factory.namedNode(pred), null);
        // console.log("Asked for subject: " + sub + " predicat: " + pred  );
        var itr = temp.quads();
        var x = itr.next();
        if (x.value.object.constructor.name === "NamedNode") {
            return x.value.object.value;
        }
        return x.value.object;
    };


    async getSubs(type) {
        const predicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        const temp = this.y_tree.match(null, factory.namedNode(predicate), factory.namedNode(type));
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value.subject.value);
            x = itr.next();
        }
        return data;
    };
}

module.exports = Database