import { Model, Schema, model } from "mongoose";
import MessageType from "../types/message";

const messageSchema = new Schema<MessageType, Model<MessageType>>(
  {
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    sendBy: {
      type: Schema.Types.ObjectId,
      required: [true, "Sender is required"],
      ref: "User",
    },
    roomId: {
      type: Schema.Types.ObjectId,
      required: [true, "Room is required"],
      ref: "Room",
    },
    seen: [
      {
        type: Schema.Types.ObjectId,
        required: [true, "User is required"],
        ref: "User",
      },
    ],
    reacted: [
      {
        user: {
          type: Schema.Types.ObjectId,
          required: [true, "User is required"],
          ref: "User",
        },
        message: {
          type: String,
          required: [true, "React message is required"],
        },
      },
    ],
    ref: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    replyMessage: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const MessageModel = model<MessageType, Model<MessageType>>(
  "Message",
  messageSchema
);
