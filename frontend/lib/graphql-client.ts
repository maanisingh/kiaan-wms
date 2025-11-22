/**
 * Hasura GraphQL Client Configuration
 * This file sets up Apollo Client for the WMS frontend
 */

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// GraphQL endpoint (update for production)
const GRAPHQL_URI = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8090/v1/graphql';

// Admin secret (for development - use JWT in production)
const ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET || 'kiaan_hasura_admin_secret_2024';

// HTTP link
const httpLink = createHttpLink({
  uri: GRAPHQL_URI,
});

// Auth link - add authentication headers
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage (if using JWT auth)
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  return {
    headers: {
      ...headers,
      // Use JWT token if available, otherwise admin secret (dev only)
      ...(token
        ? { authorization: `Bearer ${token}` }
        : { 'x-hasura-admin-secret': ADMIN_SECRET }
      ),
    },
  };
});

// Error link - handle GraphQL errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      // Define how to cache and fetch data
      Query: {
        fields: {
          Product: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          Inventory: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          SalesOrder: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// Export for use in pages
export default apolloClient;
