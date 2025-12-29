import { useFetcher, redirect } from "react-router";
import type { Route } from "./+types/users";
import { apiClient, getAuthHeaders } from "../lib/api-client.js";
import { useAuth } from "@clerk/react-router";
import { getAuth } from "@clerk/react-router/server";

/**
 * Users page - Display and manage users
 * Shows list of users with their posts
 */
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Users - Panya" },
    { name: "description", content: "Manage users" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  try {
    // Get Clerk authentication state and token
    const auth = await getAuth(args);
    
    if (!auth.userId) {
      // Redirect to sign-in if not authenticated
      return redirect("/sign-in?redirect_url=" + encodeURIComponent(args.request.url));
    }

    // Get the session token
    const token = await auth.getToken();
    
    if (!token) {
      throw new Error("Failed to get authentication token");
    }

    const url = new URL(args.request.url);
    const page = url.searchParams.get("page") || "1";
    const limit = url.searchParams.get("limit") || "10";

    // Create request with authentication token
    // Pass the request to apiClient so it can use the same origin (same worker)
    const client = apiClient(args.request);
    // Type assertion needed due to complex type inference
    const typedClient = client as any;
    const res = await typedClient.api.users.$get(
      {
        query: {
          page,
          limit,
        },
      },
      {
        headers: getAuthHeaders(token),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch users: ${res.statusText}`);
    }

    const data = await res.json();
    return { users: data.data, pagination: data.pagination };
  } catch (error) {
    console.error("Error loading users:", error);
    return {
      users: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      error: error instanceof Error ? error.message : "Failed to load users",
    };
  }
}

export default function Users({ loaderData }: Route.ComponentProps) {
  const { users, pagination, error } = loaderData;
  const fetcher = useFetcher();
  const { isSignedIn } = useAuth();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Users</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p>Error: {error}</p>
          {!isSignedIn && (
            <p className="mt-2 text-sm">
              Please sign in to view users. Some API endpoints require authentication.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="text-sm text-gray-600">
          Total: {pagination.total} users
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No users found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Run <code className="bg-gray-200 px-2 py-1 rounded">npm run db:seed</code> to add sample data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user: any) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">
                    {user.name || "Unnamed User"}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {user.posts?.length || 0} post{user.posts?.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-sm text-gray-500">ID: {user.id}</div>
              </div>

              {user.posts && user.posts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Posts:
                  </h3>
                  <ul className="space-y-2">
                    {user.posts.map((post: any) => (
                      <li
                        key={post.id}
                        className="text-sm bg-gray-50 p-2 rounded"
                      >
                        <span className="font-medium">{post.title}</span>
                        {post.published && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Published
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <fetcher.Form key={page} method="get">
                <input type="hidden" name="page" value={page} />
                <button
                  type="submit"
                  className={`px-4 py-2 rounded ${
                    pagination.page === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              </fetcher.Form>
            )
          )}
        </div>
      )}
    </div>
  );
}
