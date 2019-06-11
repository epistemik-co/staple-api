const express = require('express');
const bodyParser = require('body-parser');
const jsonld = require('jsonld');
const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode } = DataFactory;
const store = new N3.Store();

const app = express();

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
    const quads = parser.parse(rdf);
    quads.forEach( quad => store.addQuad(quad))


    const mickey = store.getQuads(namedNode('http://data/bluesB'), null, null);
    mickey.forEach(data => console.log(data.object.value));
})

app.listen(3000);