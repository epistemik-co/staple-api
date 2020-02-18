const objects = [
    {
        "_id": "http://example.com/bank",
        "_type": [
            "Organization"
        ],
        "name": "National Bank",
        "revenue": 12.5,
        "employee":  "http://example.com/john"
    },
    {
        "_id": "http://example.com/mobile",
        "_type": [
            "Organization"
        ],
        "name": "Mobile Network Provider",
        "revenue": 10,
        "employee": "http://example.com/mark"
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
            "http://example.com/bank",
            "http://example.com/mobile"
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
        "customerOf": "http://example.com/bank"
    }
]
  
module.exports = objects