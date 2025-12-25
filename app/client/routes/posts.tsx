import { useFetcher, redirect } from "react-router";
import type { Route } from "./+types/posts";
import { apiClient, getAuthHeaders } from "../lib/api-client.js";
import { useAuth } from "@clerk/react-router";
import { getAuth } from "@clerk/react-router/server";

/**
 * Posts page - Display and manage posts
 * Shows list of posts with their authors
 */
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Posts - Panya" },
    { name: "description", content: "View all posts" },
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
    // The API client uses the backend app directly in server-side loaders
    const client = apiClient();
    // Type assertion needed due to complex type inference
    const typedClient = client as any;
    const res = await typedClient.api.posts.$get(
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
      throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }

    const data = await res.json();
    return { posts: data.data, pagination: data.pagination };
  } catch (error) {
    console.error("Error loading posts:", error);
    return {
      posts: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      error: error instanceof Error ? error.message : "Failed to load posts",
    };
  }
}

export default function Posts({ loaderData }: Route.ComponentProps) {
  const { posts, pagination, error } = loaderData;
  const fetcher = useFetcher();
  const { isSignedIn } = useAuth();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Posts</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p>Error: {error}</p>
          {!isSignedIn && (
            <p className="mt-2 text-sm">
              Please sign in to view posts. Some API endpoints require authentication.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>
        <div className="text-sm text-gray-600">
          Total: {pagination.total} posts
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No posts found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Run <code className="bg-gray-200 px-2 py-1 rounded">npm run db:seed</code> to add sample data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <div className="flex items-center gap-2">
                  {post.published ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Published
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {post.content && (
                <p className="text-gray-700 mb-4">{post.content}</p>
              )}

              {post.author && (
                <div className="text-sm text-gray-600 border-t border-gray-200 pt-3">
                  <span className="font-medium">Author:</span>{" "}
                  {post.author.name || post.author.email} (ID: {post.author.id})
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">Post ID: {post.id}</div>
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
