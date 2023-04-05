"use strict";

var os = require("os");
var nodeStatic = require("node-static");
var http = require("http");
var socketIO = require("socket.io");

var fileServer = new nodeStatic.Server();
var app = http
	.createServer(function (req, res) {
		fileServer.serve(req, res);
	})
	.listen(8080);

var io = socketIO(app, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});
io.sockets.on("connection", function (socket) {
	// convenience function to log server messages on the client
	function log() {
		var array = ["Message from server:"];
		array.push.apply(array, arguments);
		socket.emit("log", array);
	}

	socket.on("message", function ({ room, message }) {
		log("Client said: ", message);
		// for a real app, would be room-only (not broadcast)
		socket.to(room).emit("message", message);
	});

	socket.on("join", function (room) {
		log("Received request to create or join room " + room);

		socket.join(room);
		log("Client ID " + socket.id + " created room " + room);
	});
});
