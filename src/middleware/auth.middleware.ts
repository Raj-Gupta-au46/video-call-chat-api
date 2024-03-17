import { NextFunction, Response } from "express";
import { Unauthorized } from "http-errors";
import { extractToken } from "../helpers/jwt.helper";
import { AuthRequest } from "../types/core";
import JWTToken from "../utils/jwt.utils";

class AuthMiddleware extends JWTToken {
  public async isAuthenticated(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (req) {
        // extract token from header
        const decoded = await extractToken(req);
        req.currentUser = {
          _id: decoded._id,
          email: decoded.email,
          role: decoded.role,
        };
        next();
      } else {
        throw new Error("User is not authenticated");
      }
    } catch (error) {
      const err = error as Error;
      res.status(401).json({
        status: "FAIL",
        error: err.message,
      });
    }
  }

  public async isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req) {
        // extract token from header
        const decoded = await extractToken(req);

        if (decoded.role !== "ADMIN")
          throw new Unauthorized(
            "Your account is not authorized to access this page."
          );

        req.currentUser = {
          _id: decoded._id,
          email: decoded.email,
          role: decoded.role,
        };
        next();
      } else {
        throw new Error("User is not authenticated");
      }
    } catch (error) {
      const err = error as Error;
      res.status(401).json({
        status: "FAIL",
        error: err.message,
      });
    }
  }
}

export default AuthMiddleware;
