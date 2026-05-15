const { Server } = require("socket.io");

let io;

const initSocket = (httpServer, options = {}) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
    ...options,
  });

  io.on("connection", (socket) => {
    socket.on("disconnect", () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

const emitEvent = (type, action, data = {}) => {
  try {
    const payload = {
      type,
      action,
      data,
      timestamp: new Date().toISOString(),
    };
    getIO().emit("dataChanged", payload);
  } catch (err) {
    console.error("Socket emit error:", err.message);
  }
};

module.exports = { initSocket, getIO, emitEvent };