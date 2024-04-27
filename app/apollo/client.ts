import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
} from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://abecao.us-east-a.ibm.stepzen.net/api/stepzen/graphql',
  cache: new InMemoryCache(),
  headers: {
    Authorization:
      'Apikey abecao::local.net+1000::def34718d59d16d641bde1e30c1aa877798d5586c821c5d03fe7b5709a06313c',
  },
});

export default client;