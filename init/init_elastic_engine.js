const {Client} = require('@elastic/elasticsearch');

const client = new Client(
  {node: `http://${process.env.ELK_USERNAME}:${process.env.ELK_PASSWORD}@localhost:9200`},
)

module.exports = client;