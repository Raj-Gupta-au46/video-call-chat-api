import { Document, ObjectId } from "mongoose";

export default interface RoomType extends Document {
  title: string;
  createBy: ObjectId;
  roomType: "PRIVATE" | "PUBLIC";
  joinedUsers: ObjectId[];
  waitingUsers: ObjectId[];
}
