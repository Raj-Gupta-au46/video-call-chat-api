import { NextFunction, Response } from "express";
import { body } from "express-validator";
import { BadRequest } from "http-errors";
import { errorHelper } from "../helpers/error.helper";
import { UserModel } from "../models/user.model";
import { AuthRequest } from "../types/core";
import MediaLogic from "../utils/media.utils";

class UserController extends MediaLogic {
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      errorHelper(req);

      const userId = req.currentUser?._id;

      const userData = await UserModel.findById(userId).select(
        "displayName phoneNumber photoUrl email emailVerified phoneNumberVerified gender dateOfBirth role isOnline isLoggedIn blockStatus createdAt "
      );

      if (!userData) throw new BadRequest("User data not found");

      res.status(200).json({
        status: "SUCCESS",
        message: "Data fetched successfully",
        data: {
          data: userData,
        },
      });
    } catch (error) {
      next(error);
    }
  };
  updateProfile = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    let userImage;

    try {
      errorHelper(req);

      const userId = req.currentUser?._id;

      const { displayName, gender, dateOfBirth, phoneNumber } = req.body;

      const avatarFile = req.files?.photo;
      const filePath = `users`;

      userImage =
        avatarFile && !Array.isArray(avatarFile)
          ? await new MediaLogic().uploadMedia(avatarFile, filePath)
          : undefined;

      let updateUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          displayName,
          gender,
          photoUrl: userImage?.url,
          photoPath: userImage?.path,
          dateOfBirth,
          phoneNumber,
        },
        { runValidators: true }
      );

      if (!updateUser) throw new BadRequest("User update failed");

      //if user update delete previous files

      await this.deleteMedia(updateUser?.photoPath);

      res.status(200).json({
        status: "SUCCESS",
        message: "User updated successfully",
        data: {
          data: updateUser,
        },
      });
    } catch (error) {
      userImage?.path && (await this.deleteMedia(userImage?.path));
      next(error);
    }
  };

  validateUserUpdate = [
    body("displayName")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Display name must be at least 3 characters long")
      .isLength({ max: 20 })
      .withMessage("Display name must be at most 20 characters long"),
    body("gender")
      .optional()
      .custom((value, { req }) => {
        if (!["MALE", "FEMALE", "OTHER", "NONE"]?.includes(value)) {
          return false;
        }
        return true;
      })
      .withMessage("gender values are MALE , FEMALE , OTHER , NONE"),
  ];
}

export default UserController;
