import Server from "./Server.js";

const server = new Server(3000);

// Handle GET requests:
// response has both "send" and "post" methods
server.get("/a", (request, response) => {});

// Handle POST requests:
// request.body will be a string
server.post("/a", (request, response) => {});

// Make an entire directory public:
server.publicize("/public");

server.listen(function onready(data) {
    console.log("Server listening!", data);
});
