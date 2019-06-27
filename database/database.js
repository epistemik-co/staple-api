const read_graphy = require('graphy').content.nt.read;
const dataset_tree = require('graphy').util.dataset.tree
const factory = require('@graphy/core.data.factory');

class Database {
    constructor() {
        this.y_tree = dataset_tree();
    }


    async create(sub, pred, obj, gra = null) {

        let quad = factory.quad(sub, pred, obj, gra)
        await this.y_tree.add(quad);
        // if(quad.object.datatype !== undefined){
        //     console.log(quad)
        // }
        // console.log("DONE")
    }


    async read(rdf) {
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


    async update() {
        console.log("update");
    }


    async delete(sub, pred, obj, gra = null) {
        let quad = factory.quad(sub, pred, obj, gra)
        await this.y_tree.delete(quad);
        // console.log(await this.getObjs('a','b'));
    }

    
    async deleteID(id) {
        var temp = this.y_tree.match(factory.namedNode(id), null, null);
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            await this.y_tree.delete(x.value);
            x = itr.next();
        }

        temp = this.y_tree.match(null, null, factory.namedNode(id));
        itr = temp.quads();
        x = itr.next();
        while (!x.done) {
            await this.y_tree.delete(x.value);
            x = itr.next();
        }
    }


    async getObjs(sub, pred) {
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

    async getTriplesBySubject(sub) {
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


    async getSingleStringValue(sub, pred) {
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