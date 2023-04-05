import { io } from "socket.io-client";

const socket = io("http://localhost:8080");

socket.connect();
socket.emit("join", "orange");
socket.on("message", message => {
	console.log(message);
});
socket.emit("message", { room: "orange", message: "hello from client" });
