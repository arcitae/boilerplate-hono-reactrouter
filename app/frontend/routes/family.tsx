import { redirect, Link } from "react-router";
import type { Route } from "./+types/family";
import { getAuth } from "@clerk/react-router/server";
import {
  useOrganization,
  useOrganizationList,
  useUser,
  useAuth,
  CreateOrganization,
  OrganizationProfile,
} from "@clerk/react-router";

/**
 * Family/Organization Profile Page - /family
 * Displays the user's organization (family) information
 */
export function meta({ }: Route.MetaArgs) {
  return [
    { title: "My Family - Panya" },
    { name: "description", content: "View and manage your family organization" },
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
    console.error("Error in /family loader:", error);
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

export default function Family({ loaderData }: Route.ComponentProps) {
  const { userId } = loaderData;
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { userMemberships, isLoaded: membershipsLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  // Show loading state while Clerk is initializing
  if (!authLoaded || !userLoaded || !orgLoaded || !membershipsLoaded) {
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

  // Get current user's role in the active organization
  const currentMembership = userMemberships?.data?.find(
    (membership) => membership.organization.id === organization?.id
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Family Profile</h1>

        <OrganizationProfile
          // path="/family"
          routing="hash"
          appearance={{
            elements: {
              rootBox: "text-sm",
              organizationSwitcherTrigger: "px-3 py-2",
            },
          }} >
          {/* You can pass the content as a component */}
          <OrganizationProfile.Page label="Custom Page" labelIcon={<DotIcon />} url="custom-page">
            <CustomPage />
          </OrganizationProfile.Page>

          {/* You can also pass the content as direct children */}
          <OrganizationProfile.Page label="Terms" labelIcon={<DotIcon />} url="terms">
            <div>
              <h1>Custom Terms Page</h1>
              <p>This is the content of the custom terms page.</p>
            </div>
          </OrganizationProfile.Page>
        </OrganizationProfile>


        {!organization && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">No Family Organization</h2>
              <p className="text-gray-600 mb-6">
                You're not currently part of any family organization. Create one to get started!
              </p>
              <CreateOrganization
                appearance={{
                  elements: {
                    rootBox: "inline-block",
                  },
                }}
                afterCreateOrganizationUrl="/family"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
