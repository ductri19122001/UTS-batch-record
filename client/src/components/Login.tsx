import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import logo from '@/assets/logo.webp'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'

const Login = () => {

  const { loginWithRedirect, user, isAuthenticated, error: auth0Error } = useAuth0();
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const navigate = useNavigate()

  useEffect(() => {
    if (user && isAuthenticated) {
      // Check for returnTo URL in localStorage (set by reauthentication)
      const returnTo = localStorage.getItem('reauthReturnTo');
      
      if (returnTo) {
        // Clear the return URL
        localStorage.removeItem('reauthReturnTo');
        // Set flag that reauthentication was successful
        localStorage.setItem('reauthSuccessful', 'true');
        navigate(returnTo);
      } else {
        // Default redirect to home
        navigate('/home');
      }
    }
  }, [user, isAuthenticated, navigate])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const description = params.get('error_description');

    if (error === "unauthorized" && description && description.toLowerCase().includes('user is blocked')) {
      setBlockedMessage('Your account has been blocked. Please contact the administrator.');

      params.delete('error');
      params.delete('error_description');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, "", newUrl);
    } else {
      setBlockedMessage(null);
    }
  }), []


  useEffect(() => {
    if (auth0Error && auth0Error.message.toLowerCase().includes('blocked')) {
      setBlockedMessage('Your account has been blocked. Please contact the administrator.');
    }
  }), [auth0Error];


  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <img className='h-30 w-full object-contain mb-10' src={logo}></img>
          <CardTitle>Welcome to NepBio Records</CardTitle>
          <CardDescription>
            Click on login below to be redirected to the login page
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {isAuthenticated && (
            <p>Currently Logged In</p>
          )}
          <div>
            {blockedMessage && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-400" role="alert">
                {blockedMessage}
              </div>)}
          </div>
          <div>
            <Button type="submit" onClick={() => loginWithRedirect()} className="w-full">
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )


}

export default Login
