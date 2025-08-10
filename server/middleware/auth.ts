import { RequestHandler } from 'express';
import { storage } from '../storage';

// Enhanced authentication middleware that supports both OAuth and local auth
export const enhancedAuth: RequestHandler = async (req: any, res, next) => {
  try {
    let user = null;

    // Check for OAuth authentication (Replit)
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      user = await storage.getUser(req.user.claims.sub);
    }
    // Check for local session authentication
    else if (req.session?.userId) {
      user = await storage.getUser(req.session.userId);
    }

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Attach user to request for downstream handlers
    req.user = req.user || {};
    req.user.id = user.id;
    req.user.role = user.role;
    req.user.email = user.email;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRoles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      if (!req.user || !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(403).json({ message: "Authorization failed" });
    }
  };
};

// Admin-only middleware
export const requireAdmin: RequestHandler = requireRole(['admin']);

// Admin or Jury middleware
export const requireAdminOrJury: RequestHandler = requireRole(['admin', 'jury']);