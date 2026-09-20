const express = require('express');
const router = express.Router();

// Defined Super Admin Credentials
const SUPER_ADMIN_CREDENTIALS = {
  username: 'Admin',
  password: '@Si14081031',
  name: 'Super Administrator',
  email: 'admin@webprosafrica.com',
  role: 'Super Admin'
};

// Defined User Admin Credentials for secondary demo access
const USER_ADMIN_CREDENTIALS = {
  username: 'UserAdmin',
  password: 'UserAdmin@2026',
  name: 'Regional Operations Admin',
  email: 'ops@webprosafrica.com',
  role: 'User Admin'
};

// Simple memory store for active demo tokens (mock JWT)
const activeSessions = new Map();

/**
 * POST /api/auth/login
 * Validates username & password against Super Admin and User Admin credentials
 */
router.post('/login', (req, res) => {
  try {
    const { username, password, requestedRole } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const trimmedUser = String(username).trim();
    const trimmedPass = String(password).trim();

    let matchedAccount = null;

    // Check Super Admin matching
    if (
      trimmedUser.toLowerCase() === SUPER_ADMIN_CREDENTIALS.username.toLowerCase() &&
      trimmedPass === SUPER_ADMIN_CREDENTIALS.password
    ) {
      matchedAccount = SUPER_ADMIN_CREDENTIALS;
    } 
    // Check User Admin matching
    else if (
      trimmedUser.toLowerCase() === USER_ADMIN_CREDENTIALS.username.toLowerCase() &&
      trimmedPass === USER_ADMIN_CREDENTIALS.password
    ) {
      matchedAccount = USER_ADMIN_CREDENTIALS;
    }

    if (!matchedAccount) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please check your username and password.'
      });
    }

    // Generate mock token and session
    const token = `biab-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const userSession = {
      id: matchedAccount.username.toLowerCase(),
      username: matchedAccount.username,
      name: matchedAccount.name,
      email: matchedAccount.email,
      role: matchedAccount.role,
      loginTime: new Date().toISOString(),
      token
    };

    activeSessions.set(token, userSession);

    return res.json({
      success: true,
      message: `Welcome back, ${userSession.name}! Authenticated as ${userSession.role}.`,
      token,
      user: userSession
    });
  } catch (err) {
    console.error('Error during authentication login:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during authentication.'
    });
  }
});

/**
 * GET /api/auth/me
 * Verifies active session token
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'No authorization header provided' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const session = activeSessions.get(token);

  if (!session) {
    // If server restarted, auto-revalidate token starting with 'biab-token-' as Super Admin default for demo continuity
    if (token.startsWith('biab-token-')) {
      const fallbackSession = {
        id: SUPER_ADMIN_CREDENTIALS.username.toLowerCase(),
        username: SUPER_ADMIN_CREDENTIALS.username,
        name: SUPER_ADMIN_CREDENTIALS.name,
        email: SUPER_ADMIN_CREDENTIALS.email,
        role: SUPER_ADMIN_CREDENTIALS.role,
        loginTime: new Date().toISOString(),
        token
      };
      activeSessions.set(token, fallbackSession);
      return res.json({ success: true, user: fallbackSession });
    }
    return res.status(401).json({ success: false, error: 'Session expired or invalid token' });
  }

  return res.json({ success: true, user: session });
});

/**
 * POST /api/auth/logout
 * Destroys session
 */
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
