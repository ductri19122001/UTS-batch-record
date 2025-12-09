import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import type { ComponentType } from 'react'
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: ComponentType,
    requiredRoles: String[]
}

const ProtectedRoute = ({children, requiredRoles}: ProtectedRouteProps) => {

    const {isAuthenticated} = useAuth0()
    const {userRoles} = useUserRoles()

    const ProtectedComponent = withAuthenticationRequired(children)

    let hasRequiredRole = () => {
        for (const role in requiredRoles) {
            if (userRoles.includes(role)) { return true }
        }
    }

    if(!isAuthenticated && hasRequiredRole()) {
        return <Navigate to="/" />
    }

    return <ProtectedComponent/>
}

export default ProtectedRoute