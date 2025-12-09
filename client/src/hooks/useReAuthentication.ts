import { useAuth0 } from '@auth0/auth0-react'
import { useState, useCallback } from 'react'
import axios from 'axios'

export function useReAuthentication() {
  const { loginWithRedirect, isAuthenticated, user } = useAuth0()
  const [isChecking, setIsChecking] = useState(false)

  const requireReAuth = useCallback(async (forcePassword: boolean = false, pendingOperation?: Record<string, unknown>): Promise<boolean> => {
    const currentUrl = window.location.pathname + window.location.search;
    
    // Store pending operation and return URL in localStorage if provided
    if (pendingOperation) {
      localStorage.setItem('pendingSignatureOperation', JSON.stringify(pendingOperation))
      localStorage.setItem('reauthReturnTo', currentUrl);
      // Clear any previous reauth success flag
      localStorage.removeItem('reauthSuccessful');
    }

    if (!isAuthenticated || !user) {
      // Not authenticated at all, redirect to login
      await loginWithRedirect({
        authorizationParams: {
          prompt: 'login',
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email read:roles offline_access'
        },
        appState: {
          returnTo: currentUrl
        }
      })
      return false
    }

    // If forcePassword is true (e.g., for digital signatures), always require password re-entry
    if (forcePassword) {
      // Store return URL for after reauthentication
      localStorage.setItem('reauthReturnTo', currentUrl);
      // Clear any previous reauth success flag
      localStorage.removeItem('reauthSuccessful');
      
      await loginWithRedirect({
        authorizationParams: {
          prompt: 'login',
          max_age: 0, // Force immediate re-authentication, no cached session
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email read:roles offline_access'
        },
        appState: {
          returnTo: currentUrl
        }
      })
      return false // Will redirect, so return false
    }

    try {
      setIsChecking(true)
      // Check security config to see if re-authentication is required
      const response = await axios.get(
        `${import.meta.env.VITE_API_SERVER_URL || 'http://localhost:3001'}/api/config/security`
      )
      
      const { enableReauth } = response.data || {}
      
      if (enableReauth) {
        // For re-auth, use loginWithRedirect with prompt=login
        // This will require the user to enter credentials again
        await loginWithRedirect({
          authorizationParams: {
            prompt: 'login',
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: 'openid profile email read:roles offline_access'
          }
        })
        return false // Will redirect, so return false
      }
      
      return true // Re-auth not required, proceed
    } catch (error) {
      console.error('Error checking re-auth requirement:', error)
      // On error, allow proceeding (fail open for development)
      return true
    } finally {
      setIsChecking(false)
    }
  }, [isAuthenticated, user, loginWithRedirect])

  return { requireReAuth, isChecking }
}

