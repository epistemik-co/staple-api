const schemaString = [
    {
        "_id": "http://example.com/bank",
        "_type": [
            "Organization"
        ],
        "name": "National Bank",
        "revenue": 12.5,
        "employee": [
            {
                "_id": "http://example.com/john"
            }
        ]
    },
    {
        "_id": "http://example.com/mobile",
        "_type": [
            "Organization"
        ],
        "name": "Mobile Network Provider",
        "revenue": 10,
        "employee": [
            {
                "_id": "http://example.com/mark"
            }
        ]
    },
    {
        "_id": "http://example.com/john",
        "_type": [
            "Person"
        ],
        "name": "John Smith",
        "age": 35,
        "isMarried": true,
        "customerOf": [
            {
                "_id": "http://example.com/bank"
            },
            {
                "_id": "http://example.com/mobile"
            }
        ]
    },
    {
        "_id": "http://example.com/mark",
        "_type": [
            "Person"
        ],
        "name": "Mark Brown",
        "age": 40,
        "isMarried": false,
        "customerOf": [
            {
                "_id": "http://example.com/bank"
            }
        ]
    }
];


module.exports = schemaString;