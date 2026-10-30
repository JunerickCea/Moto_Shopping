const { OAuth2Client } = require('google-auth-library');

function createGoogleVerifier(clientId) {
  if (!clientId) return null;
  const client = new OAuth2Client(clientId);
  return async (credential) => {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const p = ticket.getPayload();
    return {
      sub: p.sub,
      email: p.email,
      emailVerified: p.email_verified === true,
      name: p.name || p.email,
      picture: p.picture || null,
    };
  };
}

module.exports = { createGoogleVerifier };
