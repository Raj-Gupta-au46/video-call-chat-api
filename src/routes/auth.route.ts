import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import AuthenticateMiddleware from "../middleware/auth.middleware";

class Auth extends AuthenticateMiddleware {
  public router: Router;
  private authController: AuthController;

  constructor() {
    super();
    this.router = Router();
    this.authController = new AuthController();
    this.createUserRoute();
    this.loginUserRoute();
    this.changePasswordRoute();
    this.forgotPasswordOtpSendRoute();
    this.forgotPasswordOtpVerifyAndChangePasswordRoute();
    this.logoutRoute();
    this.sendVerificationEmail();
    this.verifyEmail();
  }

  // create user

  private createUserRoute(): void {
    this.router.post(
      "/auth/user/create",
      this.authController.validateUserCreationFields,
      this.authController.createUser
    );
  }
  // send verification email

  private sendVerificationEmail(): void {
    this.router.post(
      "/auth/send-email",
      this.authController.validateResendEmailVerificationFields,
      this.authController.sendVerificationEmail
    );
  }
  // send verification email

  private verifyEmail(): void {
    this.router.post(
      "/auth/send-email/verify",
      this.authController.verifyEmailValidation,
      this.authController.verifyEmail
    );
  }

  // user login
  private loginUserRoute(): void {
    this.router.post(
      "/auth/login",
      this.authController.validateLoginFields,
      this.authController.loginUser
    );
  }

  // change password
  private changePasswordRoute(): void {
    this.router.post(
      "/auth/change-password",
      this.isAuthenticated,
      this.authController.validateChangePasswordFields,
      this.authController.changePassword
    );
  }

  // forgot password
  private forgotPasswordOtpSendRoute(): void {
    this.router.post(
      "/auth/forgot-password",
      this.authController.validateForgotPasswordOtpSendFields,
      this.authController.forgotPasswordOtpSend
    );
  }

  // forgot password otp verify and change password
  private forgotPasswordOtpVerifyAndChangePasswordRoute(): void {
    this.router.post(
      "/auth/forgot-password/verify-otp",
      this.authController.validateForgotPasswordFields,
      this.authController.forgotPasswordOtpVerifyAndChangePassword
    );
  }

  // logout
  private logoutRoute(): void {
    this.router.put(
      "/auth/logout",
      super.isAuthenticated,
      this.authController.logout
    );
  }
}

export default Auth;
