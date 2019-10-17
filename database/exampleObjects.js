const objects = [
    {
        "_id": "http://example.com/bigbank",
        "_type": "Organization",
        "employee": [
            {
                "_id": "http://example.com/richard"
            },
            {
                "_id": "http://example.com/henry"
            },
            {
                "_id": "http://example.com/margaret"
            }
        ],
        "legalName": {
            "_type": "Text",
            "_value": "Big Bank Inc."
        },
        "address": {
            "_value": "70 Bridge St, London, UK",
            "_type": "Text"
        },
        "makesOffer": {
            "_id": "http://example.com/bigbank/offer"
        }
    },
    {
        "_id": "http://example.com/books",
        "_type": "Organization",
        "employee": [
            {
                "_id": "http://example.com/henry"
            },
            {
                "_id": "http://example.com/maria"
            }
        ],
        "legalName": {
            "_type": "Text",
            "_value": "Books Publisher Ltd."
        },
        "address": {
            "_value": "3 Oxford Road, Cambridge, UK",
            "_type": "Text"
        },
        "makesOffer": {
            "_id": "http://example.com/books/offer"
        },
        "funder": {
            "_id": "http://example.com/bigbank"
        }
    },
    {
        "_id": "http://example.com/richard",
        "_type": "Person",
        "name": {
            "_value": "Richard Borrow",
            "_type": "Text"
        },
        "address": {
            "_id": "http://example.com/richard/address"
        },
        "birthDate": {
            "_value": "1957-12-24",
            "_type": "Date"
        },
        "birthPlace": {
            "_id": "http://example.com/uk/london"
        },
        "children": [
            {
                "_id": "http://example.com/henry"
            },
            {
                "_id": "http://example.com/margaret"
            }
        ]
    },
    {
        "_id": "http://example.com/henry",
        "_type": "Person",
        "name": {
            "_value": "Henry Borrow",
            "_type": "Text"
        },
        "address": {
            "_id": "http://example.com/henry/address"
        },
        "birthDate": {
            "_value": "1981-09-12",
            "_type": "Date"
        },
        "birthPlace": {
            "_id": "http://example.com/uk/london"
        }
    },
    {
        "_id": "http://example.com/margaret",
        "_type": "Person",
        "name": {
            "_value": "Margaret Moneypenny",
            "_type": "Text"
        },
        "address": {
            "_id": "http://example.com/margaret/address"
        },
        "birthDate": {
            "_value": "1976-04-10",
            "_type": "Date"
        },
        "birthPlace": {
            "_id": "http://example.com/uk/london"
        }
    },
    {
        "_id": "http://example.com/maria",
        "_type": "Person",
        "name": {
            "_value": "Maria Schuster",
            "_type": "Text"
        },
        "address": {
            "_value": "Kirkstrasse 13, Berlin, Germany",
            "_type": "Text"
        },
        "birthDate": {
            "_value": "1966-01-29",
            "_type": "Date"
        },
        "birthPlace": {
            "_id": "http://example.com/germany"
        }
    },
    {
        "_id": "http://example.com/margaret/address",
        "_type": "PostalAddress",
        "addressCountry": {
            "_id": "http://example.com/uk"
        }
    },
    {
        "_id": "http://example.com/margaret/address",
        "_type": "PostalAddress",
        "addressCountry": {
            "_id": "http://example.com/uk"
        }
    },
    {
        "_id": "http://example.com/richard/address",
        "_type": "PostalAddress",
        "addressCountry": {
            "_id": "http://example.com/uk"
        }
    },
    {
        "_id": "http://example.com/henry/address",
        "_type": "PostalAddress",
        "addressCountry": {
            "_id": "http://example.com/uk"
        }
    },
    {
        "_id": "http://example.com/uk",
        "_type": "Country",
        "name": {
            "_value": "United Kingdom",
            "_type": "Text"
        }
    },
    {
        "_id": "http://example.com/germany",
        "_type": "Country",
        "name": {
            "_value": "Germany",
            "_type": "Text"
        }
    },
    {
        "_id": "http://example.com/uk/london",
        "_type": "Place",
        "name": {
          "_value": "London, UK",
          "_type": "Text"
        }
    },
    {
        "_id": "http://example.com/books/offer",
        "_type": "Offer"
    },
    {
        "_id": "http://example.com/bigbank/offer",
        "_type": "Offer"
    }
  ]
  
  
  
  module.exports = objects