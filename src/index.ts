import cookiesParser from "cookie-parser";
import cors from "cors";
import express from "express";
import uploader from "express-fileupload";
import fs from "fs";
import { createServer, Server } from "http";
import mongoose from "mongoose";
import path from "path";
import { Server as SocketServer } from "socket.io";
require("dotenv").config();

class App {
  public express: express.Application;
  private PORT = process.env.PORT || 8000;
  private server: Server;
  private io: SocketServer;

  constructor() {
    this.express = express();
    this.server = createServer(this.express);
    this.connectDB();
    this.middleware();
    this.io = new SocketServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.routes();
    this.socketConnection();
    this.listen();
  }

  private middleware(): void {
    this.express.use(cors());
    this.express.use(cookiesParser());
    this.express.use(express.json());
    this.express.use(
      uploader({
        useTempFiles: true,
      })
    );
    this.express.use((req, res, next) => {
      console.table([
        {
          METHOD: req.method,
          PATH: req.path,
          ip: req.ip,
          AGENT: req?.get("user-agent")?.split("/")[0],
        },
      ]);
      next();
    });
  }

  //   DB connection
  private connectDB(): void {
    mongoose
      .connect(process.env.MONGODB_URI || "", {})
      .then(() => {
        console.log("DB connected");
      })
      .catch((err) => {
        console.log("DB connection error:", err.message);
      });
  }

  public listen(): void {
    this.server.listen(this.PORT, () => {
      console.log(`Server started on port ${this.PORT}`);
    });
  }

  private routes(): void {
    //read files from routes folder
    const allFiles = fs.readdirSync(path.join(__dirname, "/routes"));
    // import all files from routes folder
    allFiles.forEach((file, index) => {
      // load all routes
      if (file.includes(".route.")) {
        import(path.join(__dirname + "/routes/" + file)).then((route) => {
          this.express.use("/api/v1", new route.default().router);
        });
      }
      // not found route
      if (allFiles.length - 1 === index) {
        import(
          path.join(__dirname + "/middleware/errorHandler.middleware")
        ).then((errorHandler) => {
          new errorHandler.default(this.express);
        });
      }
    });
  }

  private socketConnection() {
    try {
      let onlineUsers = new Map();

      let allRoom = new Map();

      this.io.on("connection", (socket) => {
        socket.on("user-connected", (userId) => {
          onlineUsers.set(userId, socket.id);
        });

        socket.on("user-added-to-room", (data) => {
          const userSocket = onlineUsers?.get(data?.userId);

          if (userSocket) {
            socket.to(data?.roomId).emit("new-user-added", {
              message: "New user joined",
              userId: data?.userId,
            });
            socket.to(userSocket).emit("room-joined", {
              message: `You joined to the room ${data?.roomId}`,
              roomId: data?.roomId,
            });
          }
        });

        socket.on("join-waiting-room", (data) => {
          socket
            .to(data?.roomId)
            .emit("user-added-to-waiting", { userId: data?.userId });
        });

        socket.on("user-rejected", (data) => {
          const userSocket = onlineUsers?.get(data?.userId);
          socket.to(userSocket).emit("room-rejected", { roomId: data?.roomId });
        });
        socket.on("user-accepted", (data) => {
          const userSocket = onlineUsers?.get(data?.userId);
          socket.to(userSocket).emit("room-accepted", { roomId: data?.roomId });
        });

        socket.on("new-room-joined", (data) => {
          console.log("user joined");

          socket.join(data?.roomId);

          socket.to(data?.roomId).emit("user-joined", { userId: data?.userId });
        });

        socket.on("send-signal-to-user", (data) => {
          //find user

          let user = onlineUsers.get(data?.userId);

          if (user) {
            this.io.to(user).emit("incoming-signal", {
              signal: data?.signal,
              userId: data?.byUser,
            });
          }
        });

        socket.on("exchange-signal", (data) => {
          //find user
          let user = onlineUsers.get(data?.userId);

          if (user) {
            this.io.to(user).emit("reverse-signal", {
              signal: data?.signal,
              userId: data?.byUser,
            });
          }
        });

        socket.on("new-user-joined", (data) => {
          let socketUser = onlineUsers.get(data?.userId);

          this.io.to(socketUser).emit("user-joined", {
            userId: data?.byUser,
            signal: data?.signal,
          });
        });

        socket.on("other-user-signal", (data) => {
          //find the user from allUser
          const userSocket = onlineUsers.get(data?.userId);

          if (!userSocket) return;

          socket.to(userSocket).emit("exchange-peer", {
            signal: data?.signal,
            userId: data?.byUser,
          });
        });

        //room created in socket
        socket.on("room-created", (data) => {
          let room = allRoom.get(data?.roomId);
          if (room) return;
          allRoom.set(data?.roomId, [socket.id]);
        });
        //handel messaging

        socket.on("message-send", (data) => {
          socket.to(data?.roomId).emit("message-received", data);
        });
      });
    } catch (error) {
      console.log(error, "error");
    }
  }
}
export default new App();
