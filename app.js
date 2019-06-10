const express = require('express');
const bodyParser = require('body-parser');
const jsonld = require('jsonld');
const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;
const store = new N3.Store();

const app = express();

// just use this in the browser with the provided bundle
var db = levelgraph(level("yourdb"));

app.use(bodyParser.json());

app.get('/', async (req,res,next) => {
    res.send('Hello')

    const myJsonLD = [
        {
            "@context": "http://schema.org",
            "@id": "http://data/elwoodB",
            "@type": "Person",
            "name": "Elwood Blues",
            "affiliation": {
                "@id": "http://data/bluesB"
            }
        },
        {
            "@context": "http://schema.org",
            "@id": "http://data/jakeB",
            "@type": "Person",
            "name": "Jake Blues",
            "affiliation": {
                "@id": "http://data/bluesB"
            }
        },
        {
            "@context": "http://schema.org",
            "@id": "http://data/bluesB",
            "@type": "Organization",
            "name": "Blues Broters",
            "employee": [
                {
                    "@id": "http://data/elwoodB"
                },
                {
                    "@id": "http://data/jakeB"
                }
            ],
            "numberOfEmployees": 2
        }
    ]

    const rdf = await jsonld.toRDF(myJsonLD, {format: 'application/n-quads'});

    const parser = new N3.Parser();
    //read about parser and parse method in detail
    parser.parse(rdf, (error, quad, prefixes) => {
            if (quad) {
                //console.log(quad.subject.value + " " + quad.predicate.value + " " + quad.object.value)
                //add quad to store
                store.addQuad(quad);
            }
            else {
                const mickey = store.getQuads(namedNode('http://data/bluesB'), null, null);
                mickey.forEach(x => console.log(x.object.value));
            }
    });
})

app.listen(3000);