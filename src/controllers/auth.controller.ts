import { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import { createOTP } from "../helpers/core.helper";
import { errorHelper } from "../helpers/error.helper";
import MailController from "../helpers/mail.helper";
import { UserModel } from "../models/user.model";
import { AuthRequest } from "../types/core";
import UserType from "../types/users";
import JWTToken from "../utils/jwt.utils";
import MediaLogic from "../utils/media.utils";

class Auth {
  // create user
  public async createUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // validator error handler

      errorHelper(req);
      // get provided user data
      const {
        displayName,
        email,
        password,
        phoneNumber,
        role,
        countryCode,
        gender,
      } = req.body;

      const avatarFile = req.files?.photo;
      const filePath = `users`;

      const avatarData =
        avatarFile && !Array.isArray(avatarFile)
          ? await new MediaLogic().uploadMedia(avatarFile, filePath)
          : undefined;

      const mailOTP = createOTP(6);

      // save user data to database
      const newUser: UserType = await new UserModel({
        displayName,
        email,
        rawPassword: password,
        phoneNumber,
        role,
        photo: avatarData?.url || "",
        photoPath: avatarData?.path || "",
        createdBy: req?.currentUser?._id,
        countryCode,
        gender,
        verificationInfo: {
          OTP: mailOTP,
          OTPExpiry: new Date(Date.now() + 1000 * 60 * 30),
        },
      }).save();

      await new MailController().sendHtmlMail({
        to: email,
        subject: "VChat | Verify your email",
        templet: "normal",
        html: `<h1>Verify Your Email</h1>
        <p>
          Verify your email with vChat by adding following code in your verify page.
          </p>
          <p>
          
          </p>
          if you did not create this account please ignore.
          </p>

          <h1>

          ${mailOTP}
          
          </h1>

          <a href="${process.env.WEBSITE_END_POINT}/verify-email?email=${email}">
            Verify Email
            </a>

            <p>
            Thanks, <br>
            ${process.env.WEBSITE_NAME}
            </p>
          </p>`,
      });

      // send response to client
      res.status(200).json({
        status: "SUCCESS",
        message: "User created successfully",
        data: {
          _id: newUser._id,
          displayName: newUser.displayName,
          email: newUser.email,
        },
      });
    } catch (error) {
      // send error to client
      next(error);
    }
  }

  // login user
  public async loginUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // validator error handler
      errorHelper(req);

      // get provided user data
      const { email, password } = req.body;

      // find user by email
      const userData = await UserModel.findOne({ email });

      // check if user exists
      if (!userData) {
        throw new Error("User not found");
      }
      // check if password is correct
      if (!userData.authenticate(password)) {
        throw new Error("Password is incorrect");
      }

      //check is user is blocked or not
      if (userData.blockStatus === "BLOCKED") {
        throw new Error("User is blocked");
      }

      if (!userData?.emailVerified) {
        return res.status(401).json({
          status: "Unverified",
          message: "Email is not verified.Please verify.",
          data: {},
        });
      }

      // get JWT token
      const ACCESS_TOKEN = await new JWTToken().getAccessToken({
        _id: userData._id,
        email: userData.email,
        role: userData.role,
      });

      const userAgent: string =
        req
          ?.get("user-agent")
          ?.split(")")[0]
          .replace("(", "")
          .replace(/;/g, "")
          .replace(/ /g, "-") || "unknown-device";

      await UserModel.findByIdAndUpdate(userData._id, {
        isLoggedIn: true,
        isOnline: true,
        lastLogin: new Date(),
      });

      //send new login detection to mail
      new MailController().sendHtmlMail({
        to: userData.email,
        subject: "New Login",
        templet: "normal",
        html: `<h1>New Login</h1>
        <p>
          Someone logged in to your account.
          </p>
          <p>
          Device: ${userAgent.replace(/-/g, " ")}
          </p>
          <p>
          Time: ${new Date()}

          <p>
          if you did not login to your account, please login to your account and change your password.
          </p>

          <a href="${process.env.WEBSITE_END_POINT}/signin">
            Login
            </a>

            <p>
            Thanks, <br>
            ${process.env.WEBSITE_NAME}


            </p>
          </p>`,
      });

      // send response to client
      res.setHeader("authorization", `Bearer ${ACCESS_TOKEN}`).json({
        status: "SUCCESS",
        message: "User logged in successfully",
        ACCESS_TOKEN,
        data: {
          _id: userData._id,
          displayName: userData.displayName,
          email: userData.email,
          role: userData.role,
        },
      });
    } catch (error) {
      // send error to client
      next(error);
    }
  }

  // change password
  public async changePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // validator error handler
      errorHelper(req);

      // get provided user data
      const { oldPassword, newPassword } = req.body;

      // find user by email
      const userData = await UserModel.findById(req?.currentUser?._id);

      // check if user exists
      if (!userData) throw new Error("User not found");

      // check if password is correct
      if (!userData.authenticate(oldPassword))
        throw new Error("Password is incorrect");

      // update user password
      userData.rawPassword = newPassword;
      await userData.save();

      // send response to client
      res.status(200).json({
        status: "SUCCESS",
        message: "Password changed successfully",
      });
    } catch (error) {
      // send error to client
      next(error);
    }
  }

  // forgot password otp send
  public async forgotPasswordOtpSend(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // validator error handler
      errorHelper(req);

      // get provided user data
      const { email } = req.body;

      // find user by email
      const userData = await UserModel.findOne({ email });

      // check if user exists
      if (!userData) throw new Error("User not found");

      const OTP = createOTP(6); // generate 6 digit OTP

      await UserModel.findByIdAndUpdate(userData._id, {
        verificationInfo: {
          OTP,
          OTPExpiry: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
        },
      });

      // send mail for email verification
      new MailController().sendHtmlMail({
        to: email,
        subject: "Forgot Password OTP",
        templet: "normal",
        html: `<h1>Forgot Password OTP</h1>
        <p>
          Please enter the OTP below to reset your password:
          </p>
          <h1>${OTP}</h1>
          `,
      });

      // send response to client
      res.status(200).json({
        status: "SUCCESS",
        message: "Email sent successfully",
      });
    } catch (error) {
      // send error to client
      next(error);
    }
  }

  // forgot password otp verify and change password
  public async forgotPasswordOtpVerifyAndChangePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // validator error handler

      errorHelper(req);

      // get provided user data
      const { email, OTP, newPassword } = req.body;

      // find user by email
      const userData = await UserModel.findOne({ email });

      // check if user exists
      if (!userData) throw new Error("User not found");

      // check if OTP is correct
      if (userData.verificationInfo.OTP !== OTP)
        throw new Error("OTP is incorrect");

      // check if OTP is expired
      if (new Date(userData.verificationInfo.OTPExpiry) < new Date())
        throw new Error("OTP is expired");

      // check if new password is same as old password
      if (userData.authenticate(newPassword))
        throw new Error("New password cannot be same as old password");

      // update user password
      userData.rawPassword = newPassword;
      await userData.save();

      // send response to client
      res.status(200).json({
        status: "SUCCESS",
        message: "Password changed successfully",
      });
    } catch (error) {
      // send error to client
      next(error);
    }
  }

  // verify email and phone
  public async verifyEmail(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { email, OTP } = req.body;

      const userData = await UserModel.findOne({ email });

      if (!userData) throw new Error("User not found. Please register first.");

      // check if OTP is correct
      if (userData.verificationInfo.OTP !== OTP)
        throw new Error("OTP is incorrect");

      // check if OTP is expired
      if (new Date(userData.verificationInfo.OTPExpiry) < new Date())
        throw new Error("OTP is expired");

      userData.emailVerified = true;

      await userData.save();

      // send response to client
      res.status(200).json({
        status: "SUCCESS",
        message: "Email verified",
      });
    } catch (error) {
      next(error);
    }
  }
  // verify email and phone
  public async sendVerificationEmail(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const { email } = req.body;

      const userData = await UserModel.findOne({ email });

      if (!userData) throw new Error("User not found. Please register first.");

      const OTP = createOTP(6); // generate 6 digit OTP

      await UserModel.findByIdAndUpdate(userData._id, {
        verificationInfo: {
          OTP,
          OTPExpiry: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
        },
      });

      // send mail for email verification
      new MailController().sendHtmlMail({
        to: email,
        subject: "Email verification",
        templet: "normal",
        html: `<h1>Email verification OTP</h1>
        <p>
          Please enter the OTP below to verify your email:
          </p>
          <h1>${OTP}</h1>
          `,
      });

      // send response to client
      res.status(200).json({
        status: "SUCCESS",
        message: "Email sent successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // logout
  public async logout(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const userData = await UserModel.findByIdAndUpdate(req.currentUser?._id, {
        isLoggedIn: false,
        isOnline: false,
        token: null,
      });

      if (!userData) throw new Error("User not found");

      // send response to client
      res.status(200).clearCookie("authorization").json({
        status: "SUCCESS",
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // finds validators for the user creation request
  public validateUserCreationFields = [
    body("displayName")
      .not()
      .isEmpty()
      .withMessage("displayName is required")
      .isLength({ min: 3 })
      .withMessage("Display name must be at least 3 characters long")
      .isLength({ max: 20 })
      .withMessage("Display name must be at most 20 characters long"),
    body("email")
      .not()
      .isEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("Invalid mail id"),
    body("confirmPassword", "Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password confirmation does not match");
        }
        return true;
      })
      .withMessage("Password confirmation does not match"),
    body("phoneNumber")
      .not()
      .isEmpty()
      .withMessage("phone number is required")
      .isNumeric()
      .withMessage("phone number must be a number"),
  ];

  // finds validators for the user login request
  public validateLoginFields = [
    body("email", "Email is required").isEmail().withMessage("Invalid mail id"),
    body("password", "Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ];

  // finds validators for mail verify request
  public validateResendEmailVerificationFields = [
    body("email", "Email is required").isEmail().withMessage("Invalid mail id"),
  ];

  // finds validators for password change request
  public validateChangePasswordFields = [
    body("oldPassword", "Old password is required")
      .isLength({ min: 6 })
      .withMessage("Old password must be at least 6 characters long"),
    body("newPassword", "New password is required")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long")
      .custom((value, { req }) => {
        if (value === req.body.oldPassword) {
          return false;
        }
        return true;
      })
      .withMessage("Old password and new password cannot be same"),
    body("confirmPassword", "Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("New password confirmation does not match");
        }
        return true;
      })
      .withMessage("New password confirmation does not match"),
  ];

  // finds validators for the user creation request
  public validateForgotPasswordOtpSendFields = [
    body("email", "Email is required").isEmail().withMessage("Invalid mail id"),
  ];
  public verifyEmailValidation = [
    body("email", "Email is required").isEmail().withMessage("Invalid mail id"),
    body("OTP", "Old is required")
      .isLength({ min: 6 })
      .withMessage("OTP must be at least 6 digit long")
      .toInt(),
  ];

  // finds validators for password change request
  public validateForgotPasswordFields = [
    body("email", "Email is required").isEmail().withMessage("Invalid mail id"),
    body("OTP", "OTP is required")
      .isLength({ min: 6 })
      .withMessage("OTP must be at least 6 digit long")
      .toInt(),
    body("newPassword", "New password is required")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long")
      .custom((value, { req }) => {
        if (value === req.body.oldPassword) {
          return false;
        }
        return true;
      })
      .withMessage("Old password and new password cannot be same"),
    body("confirmPassword", "Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("New password confirmation does not match");
        }
        return true;
      })
      .withMessage("New password confirmation does not match"),
  ];
}

export default Auth;
