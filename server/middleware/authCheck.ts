import { expressjwt } from 'express-jwt';
import jwks from 'jwks-rsa';

//On login after auth0 check, check if the user is in the prisma database if not add them

const authCheck = expressjwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

export default authCheck;
