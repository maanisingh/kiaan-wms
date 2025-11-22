'use client';

import { ApolloProvider as ApolloProviderBase } from '@apollo/client';
import { apolloClient } from '@/lib/graphql/client';
import { ReactNode } from 'react';

export function ApolloProvider({ children }: { children: ReactNode }) {
  return (
    <ApolloProviderBase client={apolloClient}>
      {children}
    </ApolloProviderBase>
  );
}
