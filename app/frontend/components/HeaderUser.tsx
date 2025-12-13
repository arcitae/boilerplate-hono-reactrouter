import {
  SignedIn,
  SignInButton,
  SignedOut,
  UserButton,
} from '@clerk/react-router';
import { useNavigate } from 'react-router';

const DotIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
    </svg>
  )
}
export default function HeaderUser() {
  const navigate = useNavigate();
  
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium cursor-pointer">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center gap-3">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10"
              }
            }}
            showName={true}
            userProfileMode="navigation"
            userProfileUrl={`/me`}
          >
            <UserButton.MenuItems>
              <UserButton.Action label="Family Profile" labelIcon={<DotIcon />} onClick={() => navigate('/family')} />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </SignedIn>
    </>
  );
}
  