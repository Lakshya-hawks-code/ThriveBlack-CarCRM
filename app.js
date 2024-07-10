import Express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import userRoutes from "./routes/routes.js";
import bodyParser from "body-parser";
import cors from 'cors';
import fileUpload from "express-fileupload";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { handleMessage, handleDisconnect } from './Controller/WebSocket.js';

const PORT = parseInt(process.env.PORT, 10) || 4000;
const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/";
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Successfully connected to the database");
}).catch(err => {
  console.log('Could not connect to the database. Exiting now...', err);
  process.exit();
});

const createServer = async () => {
  const app = Express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV == "production" ? ["https://abc.com", "https://abc2.com"] : "*",
    }
  });

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
  }));
  app.use(Express.static('public'));

  app.use(
    fileUpload({
      limits: { fileSize: 1024 * 1024 * 1024 },
      useTempFiles: true,
      tempFileDir: "/tmp/",
    })
  );

  app.use(cors({
    origin: process.env.NODE_ENV == "production" ? ["https://abc.com", "https://abc2.com"] : "*",
  }));

  app.use("/api/v1", userRoutes);

  // Setup Socket.IO
  io.on('connection', (socket) => {
    console.log('A user connected');

    ///for sending data to frontend
    socket.emit('message', 'Hello from client!helllo');

    // Handle incoming messages using controller function
    socket.on('order', (data) => {
      handleMessage(socket, data);
    });

    // Handle disconnection using controller function
    socket.on('disconnect', () => {
      handleDisconnect(socket);
    });
  });

  return { app, server };
};

createServer().then(({ app, server }) => {
  server.listen(PORT, () => {
    console.log(`--> Running on ${PORT}`);
  });
});
