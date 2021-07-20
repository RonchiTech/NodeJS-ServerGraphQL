const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type TestData {
        text: String!
        views: Int!
    }

    type rootQuery {
        hello: TestData!
    }

    schema {
        query: rootQuery
    }
`);
