import { Router } from "express";
import UserController from "../controllers/user.controller";
import AuthMiddleware from "../middleware/auth.middleware";

class userRoute extends AuthMiddleware {
  private userController: UserController;
  public router: Router;

  constructor() {
    super();
    this.router = Router();
    this.userController = new UserController();
    this.userRoute();
  }

  private userRoute() {
    this.router.get(
      "/my-account",
      this.isAuthenticated,
      this.userController.getProfile
    );
    this.router.put(
      "/update-profile",
      this.isAuthenticated,
      this.userController.validateUserUpdate,
      this.userController.updateProfile
    );
  }
}

export default userRoute;
