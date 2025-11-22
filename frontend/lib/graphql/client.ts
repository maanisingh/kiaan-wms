import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink } from '@apollo/client';

// HTTP connection to Hasura GraphQL API
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8090/v1/graphql',
});

// Authentication link to add JWT token to requests
const authLink = new ApolloLink((operation, forward) => {
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  operation.setContext({
    headers: {
      // Use admin secret for now (replace with JWT in production)
      'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET || 'kiaan_hasura_admin_secret_2024',
      // JWT authorization (when ready)
      // authorization: token ? `Bearer ${token}` : "",
      // 'x-hasura-role': 'admin', // or get from user context
    }
  });

  return forward(operation);
});

// Error handling link
const errorLink = new ApolloLink((operation, forward) => {
  return forward(operation).map(response => {
    if (response.errors) {
      response.errors.forEach(({ message }) =>
        console.error(`[GraphQL error]: ${message}`)
      );
    }
    return response;
  });
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      // Configure caching behavior for specific types
      Product: {
        keyFields: ['id'],
      },
      Inventory: {
        keyFields: ['id'],
      },
      SalesOrder: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
  ssrMode: typeof window === 'undefined',
});

export default apolloClient;
