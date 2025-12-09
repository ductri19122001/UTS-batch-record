import { useAuth0 } from '@auth0/auth0-react'

export const useUserRoles = () => {
  const { user, isAuthenticated } = useAuth0()

  // console.log('Auth0 User:', user)
  const rawRoles = user?.["https://nepbio.auth.com/roles"]
  const userRoles: string[] = Array.isArray(rawRoles)
    ? rawRoles.map(role => role.toString().toUpperCase())
    : []

  // console.log('User Roles:', userRoles)

  const hasRole = (role: string) => {
    if (!isAuthenticated) return false
    return userRoles.includes(role.toUpperCase())
  }

  const hasAnyRole = (roles: string[]) => {
    if (!isAuthenticated) return false
    return roles.some(role => hasRole(role))
  }

  return {
    userRoles,
    hasRole,
    hasAnyRole,
    isAdmin: hasRole('ADMIN'),
    isUser: hasRole('USER'),
    isViewer: hasRole('VIEWER')
  }
}
