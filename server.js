const http = require("http");

http
  .createServer((req, res) => {
    console.log("请求成功");
    //解析客户发来请求消息
    console.log("请求方法:" + req.method);
    console.log("请求地址:" + req.url);
    console.log("协议版本:" + req.httpVersion);
    console.log("请求头部:" + JSON.stringify(req.headers));
    res.writeHead(200, { "Content-Type": "text/plain" });

    res.end("ok");
  })
  .listen(8080, () => {
    console.log("listen 8080");
  });
