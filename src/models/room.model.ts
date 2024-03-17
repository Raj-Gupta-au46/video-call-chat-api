import { Model, Schema, model } from "mongoose";
import RoomType from "../types/room";

const roomSchema = new Schema<RoomType, Model<RoomType>>(
  {
    title: {
      type: String,
    },
    createBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    roomType: {
      type: String,
      required: true,
      enum: ["PRIVATE", "PUBLIC"],
      default: "PUBLIC",
    },
    joinedUsers: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
    ],
    waitingUsers: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const RoomModel = model<RoomType>("Room", roomSchema);
