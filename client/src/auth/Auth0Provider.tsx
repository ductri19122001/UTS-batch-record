import { Auth0Provider } from '@auth0/auth0-react'
import type { ReactNode } from 'react'

interface Auth0ProviderWrapperProps {
  children: ReactNode;
}

const Auth0ProviderWithHistory: React.FC<Auth0ProviderWrapperProps> = ({
  children,
}: Auth0ProviderWrapperProps) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN as string;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string;
  const redirectUri = window.location.origin;

  if (!domain || !clientId || !audience) {
    console.error("Missing Auth0 config in environment vars");
    // For development/testing, return children without Auth0
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: "openid profile email read:roles offline_access",
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
