const octokit = require('@octokit/rest')();
const {ApolloClient} = require('apollo-client');
const {HttpLink} = require('apollo-link-http');
const {InMemoryCache} = require('apollo-cache-inmemory');
const {setContext} = require('apollo-link-context');
const fetch = require('node-fetch');

let client;
let clientGQL;

module.exports.getClient = function() {
  if (client) {
    return client;
  }

  octokit.authenticate({
    type: 'oauth',
    token: process.env.GITHUB_TOKEN
  });

  client = octokit;

  return client;
};

module.exports.getClientGraphQL = function() {
  if (clientGQL) {
    return clientGQL;
  }

  const httpLink = new HttpLink({uri: 'https://api.github.com/graphql', fetch});
  const authLink = setContext((_, {headers}) => {
    const token = process.env.GITHUB_TOKEN;

    return {
      headers: {
        ...headers,
        authorization: token ? `token ${token}` : null
      }
    };
  });

  clientGQL = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  });

  return clientGQL;
};
