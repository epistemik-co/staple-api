const read_graphy_nt = require("graphy").content.nt.read;
const read_graphy_ttl = require("graphy").content.ttl.read;
const dataset_tree = require("graphy").util.dataset.tree;
const factory = require("@graphy/core.data.factory");
const fs = require("fs");
const { Readable } = require("stream");

class Database{
	constructor() {
		this.y_tree = dataset_tree();
    }


    async read(rdf_nt){
        let y_tree2 = this.y_tree;
        read_graphy_nt(rdf_nt, {
            data(y_quad) {
                y_tree2.add(y_quad);
            },
            eof(h_prefixes) {
                this.y_tree =  y_tree2; 
            },
        });
    }


    async readFromString(ontologyString){
        const readable = Readable.from(ontologyString);
        let y_tree2 = this.y_tree;
        var stream = readable.pipe(read_graphy_ttl())
            .on("data", (y_quad) => {
                y_tree2.add(y_quad);
            })
            .on("eof", () => {
                // console.log('Loading complete.');
            });
        await this.streamPromise(stream);
    }


    async readFromFile(filename){
        let y_tree2 = this.y_tree;
        var stream = fs.createReadStream(filename)
            .pipe(read_graphy_ttl())
            .on("data", (y_quad) => {
                y_tree2.add(y_quad);
            })
            .on("eof", () => {
                // console.log('Loading complete.');
            });
        await this.streamPromise(stream);
    }

    streamPromise(stream) {
        return new Promise((resolve, reject) => {
            stream.on("end", () => {
                resolve("end");
            });
            stream.on("finish", () => {
                resolve("finish");
            });
            stream.on("error", (error) => {
                reject(error);
            });
        });
    }

    getObjs(sub, pred){
        const temp = this.y_tree.match(factory.namedNode( sub ) ,factory.namedNode( pred ) , null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while(!x.done){
            data.push(x.value.object.value);
            x = itr.next();
        }
        return data;
    }

    getSubs(pred, obj){
        const temp = this.y_tree.match(null , factory.namedNode( pred ) , factory.namedNode( obj ));
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while(!x.done){
            data.push(x.value.subject.value);
            x = itr.next();
        }
        return data;
    }
    

    getSingleStringValue(sub, pred){
        const temp = this.y_tree.match(factory.namedNode( sub ) ,factory.namedNode( pred ) , null);
        var itr = temp.quads();
        var x = itr.next();
        if (!x.done){
            return x.value.object.value;
        } else {
            return null;
        }
    }


    getSingleLiteral(sub, pred){
        const temp = this.y_tree.match(factory.namedNode( sub ) ,factory.namedNode( pred ) , null);
        
        // console.log("Asked for subject: " + sub + " predicat: " + pred  );
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        return x.value.object;
    }
    
    getSubClasses(type){
        const predicate = "http://www.w3.org/2000/01/rdf-schema#subClassOf";
        const temp = this.y_tree.match(null,factory.namedNode( predicate ) , factory.namedNode( type ));
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while(!x.done){
            data.push(x.value.subject.value);
            x = itr.next();
        }
        return data;
    }
    
    getInstances(type){
        const predicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
        const temp = this.y_tree.match(null,factory.namedNode( predicate ) , factory.namedNode( type ));
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while(!x.done){
            data.push(x.value.subject.value);
            x = itr.next();
        }
        return data;
    }

    getAllSubs(predicate){
        const temp = this.y_tree.match(null,factory.namedNode( predicate ) , null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while(!x.done){
            data.push(x.value.subject.value);
            x = itr.next();
        }
        return data;
    }

    getAllObjs(predicate){
        const temp = this.y_tree.match(null , factory.namedNode( predicate ) , null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while(!x.done){
            data.push(x.value.object.value);
            x = itr.next();
        }
        return data;
    }


}
	
module.exports = Database;