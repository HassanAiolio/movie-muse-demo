import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Without a configured secret, fall back to a random one: tokens then die on
// restart, which is annoying but never insecure.
const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set: using a random secret, sessions reset on restart.');
}

const TOKEN_TTL = '7d';

export function signToken(userId) {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: TOKEN_TTL });
}

export function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.userId = Number(payload.id);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' });
  }
}

export function toPublicUser(user) {
  return {
    id_user: user.id_user,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
  };
}
