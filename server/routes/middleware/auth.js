const jwt = require('jsonwebtoken');
const { User } = require('../../models/user');
const logger = require('../../utils/log');

const log = logger('middleware/auth');

const authenticateWithToken = async (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (authHeader) {
    const m = authHeader.match(/^(Token|Bearer) (.+)/i);
    if (m) {
      try {
        const decoded = jwt.verify(m[2], process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = user;
          log.info(`User authenticated: ${user.email}`);
        } else {
          log.warn(`Invalid token used: ${m[2]}`);
        }
      } catch (error) {
        log.error('Error verifying token:', error);
      }
    }
  }
  next();
};

const requireUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    log.info(`Authorization header: ${authHeader}`);

    if (!authHeader) {
      log.warn('No authorization header provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      log.warn('No token provided in authorization header');
      return res.status(401).json({ error: 'Authentication required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      log.error('Error verifying JWT:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      log.warn(`User not found for token. User ID: ${decoded.userId}`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    log.info(`Authorized access: ${user.email}`);
    next();
  } catch (error) {
    log.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = {
  authenticateWithToken,
  requireUser,
}