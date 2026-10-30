const helmet = require('helmet');

function securityHeaders({ isProduction }) {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://accounts.google.com/gsi/client'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/style', 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://accounts.google.com/gsi/'],
        frameSrc: ["'self'", 'https://accounts.google.com/gsi/'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    // Google's sign-in popup needs window.opener access.
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  });
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Defence in depth on top of SameSite=Lax cookies: reject state-changing requests from other sites.
function sameOriginOnly(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const site = req.get('sec-fetch-site');
  const origin = req.get('origin');
  const crossSite = (site && site !== 'same-origin' && site !== 'none')
    || (origin && origin !== `${req.protocol}://${req.get('host')}`);
  if (crossSite) return res.status(403).json({ error: 'Cross-site request blocked.' });
  next();
}

module.exports = { securityHeaders, sameOriginOnly };
