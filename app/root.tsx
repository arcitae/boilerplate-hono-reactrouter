import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ClerkProvider } from "@clerk/react-router";
import { clerkMiddleware, rootAuthLoader } from "@clerk/react-router/server";
import type { Route } from "./+types/root";

// Import frontend components
import "@frontend/app.css";
import { Header } from "~/client/components/Header";
import { PHProvider } from "~/client/provider";
import { cloudflareContext } from "./context";

export const middleware: Route.MiddlewareFunction[] = [clerkMiddleware()];

export const loader = async (args: Route.LoaderArgs) => {
  // Get Clerk auth data from rootAuthLoader
  const authData = await rootAuthLoader(args);
  
  // Get Clerk publishable key from Cloudflare worker env
  // This is needed because Vite env vars are replaced at build time
  // and not available at runtime in Cloudflare Workers
  let publishableKey: string | undefined;
  
  try {
    const cloudflareData = args.context.get(cloudflareContext);
    if (cloudflareData?.env) {
      // Try VITE_CLERK_PUBLISHABLE_KEY first (preferred)
      publishableKey = cloudflareData.env.VITE_CLERK_PUBLISHABLE_KEY;
      // Fallback to CLERK_PUBLISHABLE_KEY
      if (!publishableKey) {
        publishableKey = cloudflareData.env.CLERK_PUBLISHABLE_KEY;
      }
    }
  } catch (error) {
    console.warn("Could not get Clerk publishable key from Cloudflare env:", error);
  }
  
  // Fallback to import.meta.env for local development
  if (!publishableKey) {
    publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  }
  
  // Return auth data with publishable key
  return {
    ...authData,
    clerkPublishableKey: publishableKey,
  };
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <PHProvider>
          {children}
          <ScrollRestoration />
          <Scripts />
        </PHProvider>
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  // Debug: Check if Clerk keys are set (only in dev)
  if (import.meta.env.DEV) {
    console.log("Clerk Publishable Key:", loaderData?.clerkPublishableKey ? "Set" : "Missing");
    console.log("LoaderData:", loaderData);
  }

  // Ensure loaderData exists and has the required structure
  if (!loaderData) {
    console.error("LoaderData is missing!");
    return <div>Error: Missing authentication data</div>;
  }

  // Get publishable key from loaderData (from Cloudflare env) or fallback to import.meta.env
  const publishableKey = loaderData.clerkPublishableKey || import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error("Clerk publishable key is missing! Set VITE_CLERK_PUBLISHABLE_KEY in wrangler.jsonc vars.");
    return <div>Error: Clerk publishable key is not configured</div>;
  }

  return (
    <ClerkProvider 
      loaderData={loaderData}
      publishableKey={publishableKey}
    >
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </ClerkProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
