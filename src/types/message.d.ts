import { Document, ObjectId } from "mongoose";

interface ReactType extends Document {
  user: ObjectId;
  message: string;
}

export default interface MessageType extends Document {
  message: string;
  sendBy: ObjectId;
  roomId: ObjectId;
  seen: ObjectId[];
  reacted: ReactType[];
  ref: ObjectId;
  replyMessage: boolean;
}
