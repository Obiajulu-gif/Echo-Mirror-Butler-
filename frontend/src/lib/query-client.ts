import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { showErrorToast } from './error-reporting'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: () => {
      showErrorToast('Unable to load the requested data. Please try again.')
    },
  }),
  mutationCache: new MutationCache({
    onError: () => {
      showErrorToast('Your change could not be saved. Please try again.')
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
    mutations: {
      retry: 0,
    },
  },
})
