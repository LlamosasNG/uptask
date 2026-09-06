import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { bindAuthCache } from './lib/authSession'
import "./index.css";
import Router from "./router";

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const { ReactQueryDevtools } = await import(
        '@tanstack/react-query-devtools'
      )
      return { default: ReactQueryDevtools }
    })
  : null

const queryClient = new QueryClient();
bindAuthCache(queryClient)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
      {ReactQueryDevtools ? (
        <Suspense fallback={null}>
          <ReactQueryDevtools />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  </StrictMode>
);
