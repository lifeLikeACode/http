const http = require("http");

http
  .createServer((req, res) => {
    //console.log("请求成功");
    //解析客户发来请求消息
    //console.log("请求方法:" + req.method);
    //console.log("请求地址:" + req.url);
    //console.log("协议版本:" + req.httpVersion);
    //console.log("请求头部:" + JSON.stringify(req.headers));

    const obj = {};
    const content = `DOCTYPEht`;
    req.on("data", (data) => {});
    req.on("end", () => {
      console.log("end");
      res.end(content);
    });
    res.writeHead(200, {
      "Content-Type": "text/html",
      "Content-Length": content.length,
      "X-Foo2": "bar2",
      "Transfer-Encoding": "chunked",
    });
  })
  .listen(8080, () => {
    console.log("listen 8080");
  });
