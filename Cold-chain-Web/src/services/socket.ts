import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_LOCAL_HOST;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket"],
});
