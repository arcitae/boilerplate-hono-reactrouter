import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton, SignOutButton } from "@clerk/react-router";
import { clerkMiddleware } from "@clerk/react-router/server";

// Types are generated for app/root.tsx, so we import from there
import type { Route } from "../../.react-router/types/app/+types/root";
import "./app.css";
import { Header } from "./components/Header";

export const middleware: Route.MiddlewareFunction[] = [clerkMiddleware()];

// Note: loader is defined in app/root.tsx to ensure React Router calls it correctly

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
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  // Debug: Check if Clerk keys are set (only in dev)
  if (import.meta.env.DEV) {
    console.log("Clerk Publishable Key:", import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? "Set" : "Missing");
    console.log("LoaderData:", loaderData);
  }

  // Ensure loaderData exists and has the required structure
  if (!loaderData) {
    console.error("LoaderData is missing!");
    return <div>Error: Missing authentication data</div>;
  }

  return (
    <ClerkProvider 
      loaderData={loaderData}
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
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
