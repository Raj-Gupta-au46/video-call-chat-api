import { NextFunction, Response } from "express";
import { body, param } from "express-validator";
import { BadRequest, NotFound } from "http-errors";
import { errorHelper } from "../helpers/error.helper";
import { RoomModel } from "../models/room.model";
import { AuthRequest } from "../types/core";

class RoomController {
  createRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      errorHelper(req);

      const userId = req.currentUser?._id;

      const { roomType, title } = req?.body;

      const roomCreated = await RoomModel.create({
        createBy: userId,
        title,
        roomType: roomType,
        joinedUsers: [userId],
      });

      if (!roomCreated) throw new BadRequest("Room creation failed");

      res.status(200).json({
        status: "SUCCESS",
        message: "Room created successfully",
        data: {
          data: roomCreated,
        },
      });
    } catch (error) {
      next(error);
    }
  };
  joinPrivateRoom = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      errorHelper(req);

      const user = req?.currentUser?._id;

      const { userId, roomId } = req?.params;

      //find and update room

      const joinRoom = await RoomModel.findOneAndUpdate(
        { _id: roomId, joinedUsers: { $nin: [userId] } },
        {
          createBy: user,
          $push: { joinedUsers: userId },
          $pull: {
            waitingUsers: userId,
          },
        }
      );

      if (!joinRoom) throw new BadRequest("Room join failed");

      res.status(200).json({
        status: "SUCCESS",
        message: "Room joined successfully",
      });
    } catch (error) {
      next(error);
    }
  };
  joinARoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      errorHelper(req);

      const user = req?.currentUser?._id;

      const { roomId } = req?.params;

      //find room

      const room = await RoomModel.findById(roomId);

      if (!room) throw new NotFound("Room does not exist");
      //check if already exist in room

      const alreadyExist = room?.joinedUsers?.includes(user as any);

      if (
        room?.roomType === "PRIVATE" &&
        room?.createBy !== (user as any) &&
        !alreadyExist
      ) {
        if (
          !room?.waitingUsers?.includes(user as any) &&
          !room?.joinedUsers?.includes(user as any)
        ) {
          room.waitingUsers.push(user as any);
        }
      } else {
        if (!room?.joinedUsers?.includes(user as any) && !alreadyExist) {
          room.joinedUsers.push(user as any);
        }
      }

      //find and update room
      await room.save();

      res.status(200).json({
        status: "SUCCESS",
        message: ` ${
          room?.roomType === "PRIVATE"
            ? String(room?.createBy) === user
              ? "Joined room successfully"
              : "Join request sent successfully"
            : "Joined room successfully"
        } `,
        data: {
          data: {
            joined:
              room?.roomType === "PRIVATE"
                ? String(room?.createBy) === user
                  ? true
                  : alreadyExist
                : true,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
  removeRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      errorHelper(req);

      const user = req?.currentUser?._id;

      const { roomId, userId } = req?.params;

      //find and update room

      const waitRoom = await RoomModel.findOneAndUpdate(
        {
          _id: roomId,
          createdBy: user,
        },
        {
          $pull: {
            joinedUsers: { $elemMatch: userId },
          },
        }
      );

      if (!waitRoom) throw new BadRequest("Remove from room failed");

      res.status(200).json({
        status: "SUCCESS",
        message: "Remove from room successfully",
      });
    } catch (error) {
      next(error);
    }
  };
  removeFromRoom = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      errorHelper(req);

      const user = req?.currentUser?._id;

      const { roomId, userId } = req?.params;

      //find and update room

      const waitRoom = await RoomModel.findByIdAndUpdate(roomId, {
        $pull: {
          joinedUsers: { $elemMatch: userId },
        },
      });

      if (!waitRoom) throw new BadRequest("Remove from room failed");

      res.status(200).json({
        status: "SUCCESS",
        message: "Remove from room successfully",
      });
    } catch (error) {
      next(error);
    }
  };
  rejectRequest = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      errorHelper(req);

      const user = req?.currentUser?._id;

      const { roomId, userId } = req?.params;

      //find and update room

      const waitRoom = await RoomModel.findOneAndUpdate(
        {
          _id: roomId,
          createdBy: user,
        },
        {
          $pull: {
            waitingUsers: { $elemMatch: userId },
          },
        }
      );

      if (!waitRoom) throw new BadRequest("Request reject failed");

      res.status(200).json({
        status: "SUCCESS",
        message: "User rejected successfully",
      });
    } catch (error) {
      next(error);
    }
  };
  deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      errorHelper(req);

      const user = req?.currentUser?._id;

      const { roomId } = req?.params;

      //find and update room

      const waitRoom = await RoomModel.findOneAndDelete({
        _id: roomId,
        createBy: user,
      });

      if (!waitRoom) throw new BadRequest("Room delete failed");

      res.status(200).json({
        status: "SUCCESS",
        message: "Deleting room successfully",
      });
    } catch (error) {
      next(error);
    }
  };
  getRoomData = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      errorHelper(req);

      const user = req?.currentUser?._id;

      const { roomId } = req?.params;

      //find and update room

      const roomData = await RoomModel.findOne({
        _id: roomId,
        joinedUsers: { $elemMatch: { $eq: user } },
      })
        .select("-__v -updatedAt")
        .populate([
          {
            path: "createBy",
            select: "_id displayName email photoUrl ",
          },
          {
            path: "joinedUsers",
            select: "_id displayName email photoUrl ",
          },
          {
            path: "waitingUsers",
            select: "_id displayName email photoUrl ",
          },
        ]);

      if (!roomData) throw new BadRequest("No data found");

      res.status(200).json({
        status: "SUCCESS",
        message: "Room data found  successfully",
        data: {
          data: roomData,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  createRoomValidation = [
    body("roomType")
      .optional()
      .custom((value) => {
        if (["PUBLIC", "PRIVATE"].includes(value)) {
          return true;
        } else {
          return false;
        }
      })
      .withMessage("Room type cam only be PUBLIC or PRIVATE"),
  ];

  joinRoomValidate = [
    param("roomId")
      .not()
      .isEmpty()
      .withMessage("Room id is required")
      .isMongoId()
      .withMessage("Enter a valid id"),
    param("userId")
      .not()
      .isEmpty()
      .withMessage("User id is required")
      .isMongoId()
      .withMessage("Enter a valid  user id"),
  ];

  joinAllRoomValidation = [
    param("roomId")
      .not()
      .isEmpty()
      .withMessage("Room id is required")
      .isMongoId()
      .withMessage("Enter a valid id"),
  ];

  joinPublicRoomValidate = [
    param("roomId")
      .not()
      .isEmpty()
      .withMessage("Room id is required")
      .isMongoId()
      .withMessage("Enter a valid id"),
  ];
  waitingPrivateRoomValidate = [
    param("roomId")
      .not()
      .isEmpty()
      .withMessage("Room id is required")
      .isMongoId()
      .withMessage("Enter a valid id"),
  ];
  removeRoomValidation = [
    param("roomId")
      .not()
      .isEmpty()
      .withMessage("Room id is required")
      .isMongoId()
      .withMessage("Invalid room Id"),
    param("userId")
      .not()
      .isEmpty()
      .withMessage("User id is required")
      .isMongoId()
      .withMessage("Invalid user Id"),
  ];
  rejectRoomValidation = [
    param("roomId")
      .not()
      .isEmpty()
      .withMessage("Room id is required")
      .isMongoId()
      .withMessage("Invalid room Id"),
    param("userId")
      .not()
      .isEmpty()
      .withMessage("User id is required")
      .isMongoId()
      .withMessage("Invalid user Id"),
  ];
  deleteRoomValidation = [
    param("roomId")
      .not()
      .isEmpty()
      .withMessage("Room id is required")
      .isMongoId()
      .withMessage("Invalid room Id"),
  ];
}

export default RoomController;
