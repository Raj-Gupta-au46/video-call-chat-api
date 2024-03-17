import { NextFunction, Response } from "express";
import { body, param, query } from "express-validator";
import { BadRequest } from "http-errors";
import { errorHelper } from "../helpers/error.helper";
import paginationHelper from "../helpers/pagination.helper";
import { MessageModel } from "../models/message.model";
import { AuthRequest } from "../types/core";

class MessageController {
  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      errorHelper(req);

      const userId = req.currentUser?._id;

      //get room id from params

      const roomId = req.params?.roomId;

      //get data from req.body

      const { message, ref } = req.body;

      const messageData = await MessageModel.create({
        message: message,
        ref: ref,
        replyMessage: ref ? true : false,
        sendBy: userId,
        roomId,
        seen: [userId],
      });

      if (!messageData) throw new BadRequest("Message creation failed.");

      res.status(200).json({
        status: "SUCCESS",
        message: "Message saved successfully",
        data: {
          data: messageData,
        },
      });
    } catch (error) {
      next(error);
    }
  };
  getMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      errorHelper(req);
      //get room id from params

      const roomId = req.params?.roomId;

      //get data from req.query

      const { perPage, pageNo } = req.query;

      const messageData = await paginationHelper({
        model: MessageModel,
        query: {
          roomId,
        },
        perPage,
        pageNo,
        populate: [
          {
            path: "sendBy",
            select: "_id displayName photoUrl",
          },
          {
            path: "seen",
            select: "_id displayName photoUrl",
          },
          {
            path: "reacted",
            populate: {
              path: "user",
              select: "_id displayName photoUrl",
            },
          },
        ],
      });

      if (!messageData) throw new BadRequest("Message fetch failed.");

      res.status(200).json({
        status: "SUCCESS",
        message: "Message fetched successfully",
        data: messageData,
      });
    } catch (error) {
      next(error);
    }
  };
  updateMessage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      errorHelper(req);

      //get room id from params

      const messageId = req.params?.messageId;

      //get data from req.body

      const { seenUser, reactedUser, reactMessage } = req.body;

      const messageData = await MessageModel.findByIdAndUpdate(
        messageId,
        {
          $push: {
            seen: seenUser,
            reacted: {
              user: reactedUser,
              message: reactMessage,
            },
          },
        },
        {
          runValidators: true,
        }
      );

      if (!messageData) throw new BadRequest("Message update failed.");

      res.status(200).json({
        status: "SUCCESS",
        message: "Message updated successfully",
        data: {
          data: messageData,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  validateMessageCreate = [
    body("message").not().isEmpty().withMessage("message is required"),
    param("roomId")
      .not()
      .isEmpty()
      .withMessage("roomId is required")
      .isMongoId()
      .withMessage("enter a valid roomId"),
    body("ref").optional().isMongoId().withMessage("enter a valid ref"),
  ];
  validateGetMessage = [
    param("roomId")
      .not()
      .isEmpty()
      .withMessage("roomId is required")
      .isMongoId()
      .withMessage("enter a valid roomId"),
    query("perPage")
      .optional()
      .isNumeric()
      .withMessage("enter a valid perPage")
      .toInt(),
    query("pageNo")
      .optional()
      .isNumeric()
      .withMessage("enter a valid pageNo")
      .toInt(),
  ];
  validateUpdateMessage = [
    body("seenUser")
      .optional()
      .isMongoId()
      .withMessage("enter a valid user id"),
    body("reactedUser")
      .optional()
      .isMongoId()
      .withMessage("enter a valid reactedId"),
    param("messageId")
      .not()
      .isEmpty()
      .withMessage("messageId is required")
      .isMongoId()
      .withMessage("enter a valid messageId"),
  ];
}

export default MessageController;
