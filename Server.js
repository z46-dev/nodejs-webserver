import http from "http";
import url from "url";
import fs from "fs";

function responsify(response, server) {
    response.send = function(content) {
        response.writeHead(200, server.responseHeaders);
        response.end(content);
    }
    response.json = function(json) {
        if (typeof json === "object") {
            json = JSON.stringify(json);
        }
        response.send(json);
    }
    return response;
}

const pageNotFound = `
<!DOCTYPE html>
<html>
    <head>
        <title>Page not found</title>
        <style>
            * {
                font-family: sans-serif;
                font-size: x-large;
                font-weight: bold;
            }
            body {
                width: 100%;
                height: 100%;
                padding: 0px;
                margin: 0px;
                background-image: repeating-conic-gradient(#F8F8F8 0 15deg, #FFFFFF 15deg 30deg);
                background-attachment: fixed;
                text-align: center;
            }
            #mainBody {
                position: absolute;
	              top: 50%;
	              left: 50%;
	              transform: translate(-50%, -50%);
            }
            #mainBody h1 {
                font-size: xxx-large;
            }
            .smaller {
                font-size: large;
                font-weight: normal;
            }
            #footer {
                position: absolute;
                bottom: 5%;
	              left: 50%;
	              transform: translate(-50%, -50%);
            }
        </style>
    </head>
    <body>
        <div id="mainBody">
            <h1>404</h1>
            <span>The page or resource you requested cannot be served.</span><br/>
            <span class="smaller">If you know the site's manager or owner, please contact them.</span>
        </div>
        <span id="footer" class="smaller">This site is powered by a custom webserver engine made by Evan G. Parker.</span>
    </body>
</html>
`;

class Server {
    constructor(port, accessControlAllowOrigin = "*") {
        if (!Number.isFinite(port) || port !== Math.round(port)) {
            throw new RangeError("The argument 'port' must be a valid integer!");
        }
        this.port = port;
        this.getMethods = new Map();
        this.postMethods = new Map();
        this.responseHeaders = {
            "Access-Control-Allow-Origin": accessControlAllowOrigin,
            "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
            "Access-Control-Max-Age": 2592000
        };
        this.publicDirectory = -1;
        this.server = http.createServer((request, response) => {
            let parsedURL = url.parse(request.url),
                path = parsedURL.pathname.replace(/\/+$/, "") || "/";
            response = responsify(response, this);
            if (this.getMethods.has(path)) {
                this.getMethods.get(path)(request, response);
                return;
            }
            if (this.postMethods.has(path) && request.method === "POST") {
                let body = "";
                request.on("data", (chunk) => {
                    body += chunk;
                });
                request.on("end", () => {
                    request.body = body;
                    this.postMethods.get(path)(request, response);
                });
                return;
            }
            if (this.publicDirectory !== -1) {
                let filePath = this.publicDirectory + (path === "/" ? "/index.html" : path);
                if (fs.existsSync(filePath)) {
                    if (fs.statSync(filePath).isDirectory()) {
                        response.writeHead(404, this.responseHeaders);
                        response.end(pageNotFound);
                        return;
                    }
                    response.send(fs.readFileSync(filePath));
                    return;
                }
            }
            response.writeHead(404, this.responseHeaders);
            response.end(pageNotFound);
        });
    }
    listen(callback = function() {}) {
        this.server.listen(this.port, () => {
            callback({
                port: this.port,
                time: Date.now()
            });
        });
    }
    get(rout, callback) {
        this.getMethods.set(rout, callback);
    }
    post(rout, callback) {
        this.postMethods.set(rout, callback);
    }
    publicize(path, mainPath) {
        this.publicDirectory = path;
    }
}

export default Server;
