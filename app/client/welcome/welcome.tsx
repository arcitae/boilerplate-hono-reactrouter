import { useOrganization, useOrganizationList } from "@clerk/react-router";
import logoDark from "./logo-dark.svg";
import logoLight from "./logo-light.svg";

export function Welcome({ message }: { message: string }) {
  const { organization } = useOrganization()
  const { userMemberships } = useOrganizationList({
    userMemberships: true,
  })


  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <div className="w-[500px] max-w-[100vw] p-4">
            <img
              src={logoLight}
              alt="React Router"
              className="block w-full dark:hidden"
            />
            <img
              src={logoDark}
              alt="React Router"
              className="hidden w-full dark:block"
            />
          </div>
        </header>
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">
            Welcome to the <strong>{organization?.name}</strong> organization!
          </h1>
          <p className="mb-6">
            Your role in this organization:{' '}
            <strong>
              {
                userMemberships?.data?.find(
                  (membership) => membership.organization.id === organization?.id,
                )?.role
              }
            </strong>
          </p>
        </div>
      </div>
    </main>
  );
}
