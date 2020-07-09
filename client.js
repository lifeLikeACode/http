const net = require("net");

class Requset {
  constructor(options) {
    const contentType = "Content-Type";
    const { method, port, host, path, headers, body } = options;
    this.method = method || "GET";
    this.port = port || 80;
    this.path = path || "/";
    this.host = host || "localhost";
    this.headers = headers || {};
    this.body = body;
    if (!this.headers[contentType]) {
      this.headers[contentType] = "application/json";
    }

    if (this.headers[contentType] === "application/json") {
      this.bodyText = JSON.stringify(this.body);
    } else if (this.headers[contentType] === "text/plain") {
      this.bodyText = Object.keys(this.body)
        .map((key) => `${key}=${this.body[key]}`)
        .join("&");
    }
    this.headers["content-length"] = this.bodyText.length;
  }
  parseHeader() {
    return Object.keys(this.headers)
      .map((key) => {
        return `${key}:${this.headers[key]}`;
      })
      .join("\r\n");
  }

  toString() {
    return `${this.method} ${
      this.path
    } HTTP/1.1\r\n${this.parseHeader()}\r\n\r\n${this.bodyText}\r\n`;
  }

  send(connection) {
    return new Promise((resolve, reject) => {
      if (connection) {
        console.log("已经有连接");

        connection.write(this.toString());
      } else {
        console.log("没有连接");
        connection = net.createConnection(
          { port: this.port, host: this.host },
          () => {
            // 'connect' 监听器
            console.log("已连接到服务器");
            connection.write(this.toString());
          }
        );
      }
      connection.on("data", (data) => {
        resolve(data.toString());
        connection.end();
      });
      connection.on("error", (error) => {
        reject(error);
        connection.end();
      });
      connection.on("end", () => {
        console.log("已从服务器断开");
      });
    });
  }
}
!(async function () {
  const request = new Requset({
    method: "GET",
    port: 8080,
    host: "localhost",
    path: "/",
    headers: {
      "Content-Type": "text/plain",
    },
    body: { name: "xujian" },
  });
  const connection = await request.send();

  console.log(connection);
})();
