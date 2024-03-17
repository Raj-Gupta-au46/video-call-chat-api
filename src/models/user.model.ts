import { model, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import UserType from "../types/users";
const crypto = require("crypto");

const userSchema = new Schema<UserType>(
  {
    displayName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
    },
    photoUrl: String,
    photoPath: String,
    email: {
      type: String,
      unique: true,
      required: [true, "Email address is required."],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumberVerified: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: "String",
      enum: ["MALE", "FEMALE", "OTHER", "NONE"],
      default: "NONE",
    },
    password: String,
    salt: String,
    dateOfBirth: String,
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    fcmTokens: {
      web: String,
      android: String,
      ios: String,
    },
    isLoggedIn: Boolean,
    isOnline: Boolean,
    blockStatus: {
      type: String,
      enum: ["BLOCKED", "UNBLOCKED"],
      default: "UNBLOCKED",
    },
    verificationInfo: {
      OTP: Number,
      OTPExpiry: Date,
    },
  },
  { timestamps: true }
);

userSchema
  .virtual("rawPassword")
  .set(function (rawPassword) {
    this.salt = uuidv4();
    this.password = this.encryptPassword(rawPassword);
  })
  .get(function () {
    return this.password;
  });

userSchema.methods.authenticate = function (rawPassword: string) {
  return this.encryptPassword(rawPassword) === this.password;
};
userSchema.methods.encryptPassword = function (rawPassword: string) {
  if (!rawPassword) {
    return "";
  }
  try {
    return crypto
      .createHash("sha256", this.salt)
      .update(rawPassword)
      .digest("hex");
  } catch (error) {
    console.log("password encryption error:", error);
    return "";
  }
};

export const UserModel = model<UserType>("User", userSchema);
