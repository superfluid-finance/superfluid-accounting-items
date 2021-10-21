const { ApolloClient, InMemoryCache, gql } = require("@apollo/client/core");
const { createHttpLink } = require("apollo-link-http");
const fetch = require("cross-fetch");

const client = new ApolloClient({
  link: createHttpLink({
    uri:
      "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-dev-matic",
    fetch,
  }),
  cache: new InMemoryCache(),
});

async function queryStreamPeriods() {
  const result = await client.query({
    query: gql`
      query FlowUpdatedEvents($accountId: ID) {
        {
            account(id: "0xafad93492b75cdfb3e685c09966aa8ee6ad872c4") {
              id
              inflows {
                ...streamFields
              }
              outflows {
                ...streamFields
              }
            }
          }
          
          fragment streamFields on Stream {
                createdAtTimestamp
                updatedAtTimestamp
                
                flowUpdatedEvents {
                  token
                  sender
                  receiver
                  flowRate
                }
          }
      }
    `,
  });
  console.log(result);
  return result;
}

module.exports = { queryStreamPeriods };
