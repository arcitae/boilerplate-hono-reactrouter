import { redirect } from "react-router";
import type { Route } from "./+types/me";
import { getAuth } from "@clerk/react-router/server";
import { useUser, useAuth, UserProfile, OrganizationProfile } from "@clerk/react-router";

/**
 * User Profile Page - /me
 * Displays the authenticated user's profile information
 */
export function meta({ }: Route.MetaArgs) {
  return [
    { title: "My Profile - Panya" },
    { name: "description", content: "View and manage your profile" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  try {
    // Get Clerk authentication state
    const auth = await getAuth(args);

    if (!auth.userId) {
      // Redirect to sign-in if not authenticated
      return redirect("/sign-in?redirect_url=" + encodeURIComponent(args.request.url));
    }

    // Return user ID for client-side fetching
    return { userId: auth.userId };
  } catch (error) {
    console.error("Error in /me loader:", error);
    throw error;
  }
}

const DotIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
    </svg>
  )
}

const CustomPage = () => {
  return (
    <div>
      <h1>Custom page</h1>
      <p>This is the content of the custom page.</p>
    </div>
  )
}

export default function Me({ loaderData }: Route.ComponentProps) {
  const { userId } = loaderData;
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  // Show loading state while Clerk is initializing
  if (!isLoaded || !userLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not signed in (client-side check)
  if (!isSignedIn) {
    return redirect("/sign-in?redirect_url=" + encodeURIComponent(window.location.href));
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            <p>Unable to load user profile. Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <UserProfile routing="hash" >

          {/* You can pass the content as a component */}
          <UserProfile.Page label="Custom Page" labelIcon={<DotIcon />} url="custom-page">
            <CustomPage />
          </UserProfile.Page>

          {/* You can also pass the content as direct children */}
          <UserProfile.Page label="Terms" labelIcon={<DotIcon />} url="terms">
            <div>
              <h1>Custom Terms Page</h1>
              <p>This is the content of the custom terms page.</p>
            </div>
          </UserProfile.Page>
        </UserProfile>
      </div>
    </div>
  );
}
