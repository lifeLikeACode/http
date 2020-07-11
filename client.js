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
    } else {
      this.bodyText = JSON.stringify(this.body);
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
      const response = new Response();
      if (connection) {
        connection.write(this.toString());
      } else {
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
        response.recevice(data.toString());
        if (response.isFinished) {
          resolve(response.response);
        }
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

class Response {
  constructor() {
    this.statusLine = "";
    this.headers = {};
    this.headerName = "";
    this.headerValue = "";
    this.body = null;
    // this.CR = String.fromCharCode(13);
    // this.LF = String.fromCharCode(10);
    this.WAITTING_STATUS_LINE = 0;
    this.WAITTING_STATUS_LINE_END = 1;
    this.WAITTING_HEADER_NAME = 2;
    this.WAITTING_HEADER_SPACE = 3;
    this.WAITTING_HEADER_VALUE = 4;
    this.WAITTING_HEADER_END = 5;
    this.WAITTING_HEADER_BLOCK_END = 6;
    this.WAITTING_BODY = 7;

    this.currentStatus = this.WAITTING_STATUS_LINE;
  }
  get isFinished() {
    return this.body && this.body.isFinished;
  }
  get response() {
    this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
    return {
      statusCode: RegExp.$1,
      statusText: RegExp.$2,
      header: this.headers,
      content: this.body.content.join(""),
    };
  }
  recevice(data) {
    for (let i = 0; i < data.length; i++) {
      this.receviceChar(data[i]);
    }
  }
  receviceChar(char) {
    if (this.currentStatus === this.WAITTING_STATUS_LINE) {
      if (char === "\r") {
        this.currentStatus = this.WAITTING_STATUS_LINE_END;
      }
      // else if (char === "\n") {
      //   this.currentStatus = this.WAITTING_HEADER_LINE_NAME;
      // }
      else {
        this.statusLine += char;
      }
    } else if (this.currentStatus === this.WAITTING_STATUS_LINE_END) {
      if (char === "\n") {
        this.currentStatus = this.WAITTING_HEADER_NAME;
      } else {
        this.statusLine += char;
      }
    } else if (this.currentStatus === this.WAITTING_HEADER_NAME) {
      if (char === ":") {
        this.currentStatus = this.WAITTING_HEADER_SPACE;
      } else if (char === "\r") {
        this.currentStatus = this.WAITTING_HEADER_BLOCK_END;
        //if (this.headers["Transfer-Encoding"] === "") {
        this.body = new ChunkedBodyParse();
        //}
      } else {
        this.headerName += char;
      }
    } else if (this.currentStatus === this.WAITTING_HEADER_SPACE) {
      if (char === " ") {
        this.currentStatus = this.WAITTING_HEADER_VALUE;
      }
    } else if (this.currentStatus === this.WAITTING_HEADER_VALUE) {
      if (char === "\r") {
        this.currentStatus = this.WAITTING_HEADER_END;
        this.headers[this.headerName] = this.headerValue;
        this.headerName = "";
        this.headerValue = "";
      } else {
        this.headerValue += char;
      }
    } else if (this.currentStatus === this.WAITTING_HEADER_END) {
      if (char === "\n") {
        this.currentStatus = this.WAITTING_HEADER_NAME;
      }
    } else if (this.currentStatus === this.WAITTING_HEADER_BLOCK_END) {
      if (char === "\n") {
        this.currentStatus = this.WAITTING_BODY;
      }
    } else if (this.currentStatus === this.WAITTING_BODY) {
      this.body.receviceChar(char);
    }
  }
}
class ChunkedBodyParse {
  constructor() {
    this.WAITTING_LENGTH = 0;
    this.WAITTING_LENGTH_END = 1;
    this.READING_TRUNK = 2;
    this.WAITTING_NEW_LINE = 3;
    this.WAITTING_NEW_LINE_END = 4;
    this.length = 0;
    this.content = [];
    this.isFinished = false;
    this.currentStatus = this.WAITTING_LENGTH;
  }

  receviceChar(char) {
    //console.log(JSON.stringify(char));

    if (this.currentStatus === this.WAITTING_LENGTH) {
      if (char === "\r") {
        if (this.length === 0) {
          console.log("===============");
          console.log(this.content);

          this.isFinished = true;
        }
        this.currentStatus = this.WAITTING_LENGTH_END;
      } else {
        this.length *= 10;
        this.length += char.charCodeAt(0) - "0".charCodeAt(0);
      }
    } else if (this.currentStatus === this.WAITTING_LENGTH_END) {
      if (char === "\n") {
        this.currentStatus = this.READING_TRUNK;
      }
    } else if (this.currentStatus === this.READING_TRUNK) {
      if (this.length === 0) {
        this.currentStatus = this.WAITTING_NEW_LINE;
      } else {
        this.content.push(char);
        this.length--;
      }
    } else if (this.currentStatus === this.WAITTING_NEW_LINE) {
      if (char === "\r") {
        this.currentStatus = this.WAITTING_NEW_LINE_END;
      }
    } else if (this.currentStatus === this.WAITTING_NEW_LINE_END) {
      if (char === "\n") {
        this.currentStatus = this.WAITTING_LENGTH;
      }
    }
  }
}
!(async function () {
  const request = new Requset({
    method: "GET",
    port: 8080,
    host: "localhost",
    path: "/",
    headers: {
      "Content-Type": "text/html",
      "X-Foo": "bar",
      // "Transfer-Encoding": "chunked",
    },
    body: { name: "xujian" },
  });
  const connection = await request.send();

  //console.log(connection);
})();
