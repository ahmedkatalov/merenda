import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { isApiError } from '@/lib/api';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => {
        if (isApiError(err) && (err.status === 401 || err.status === 403 || err.status === 404 || err.status === 400)) return false;
        return count < 1;
      },
    },
    mutations: { retry: 0 },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        closeButton
        toastOptions={{
          duration: 3200,
          classNames: {
            toast: '!rounded-xl !border-zinc-200 !shadow-pop !text-[13.5px] !font-sans',
            title: '!font-medium',
          },
        }}
      />
    </QueryClientProvider>
  );
}
