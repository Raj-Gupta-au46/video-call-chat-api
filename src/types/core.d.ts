import { Request } from "express";
import mongoose from "mongoose";

export interface JwtDecodedType {
  _id: mongoose.Types.ObjectId | string;
  email: string;
  role: "ADMIN" | "USER";
}

// auth request
export interface AuthRequest extends Request {
  currentUser?: JwtDecodedType;
}

export interface ImageType {
  url: string;
  path: string;
}
