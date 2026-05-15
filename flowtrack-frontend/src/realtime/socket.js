import { io } from "socket.io-client";

const resolveSocketUrl = () => {
  const explicit = process.env.REACT_APP_SOCKET_URL;
  if (explicit) return explicit;

  const api = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  return api.replace(/\/api\/?$/, "");
};

const socket = io(resolveSocketUrl(), {
  autoConnect: false,
  transports: ["websocket"],
});

export const connectSocket = () => {
  if (!socket.connected) socket.connect();
  return socket;
};

export default socket;