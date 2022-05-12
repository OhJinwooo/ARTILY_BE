require("dotenv").config();
const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const app = express();
const app_low = express(); //http
const httpsPort = process.env.HTTPSPORT;
const httpPort = process.env.PORT;
const server = http.createServer(app);
const socket = require("./socket");
/* const option = {
  key:
  cert:
}; */
const kakaoRouter = require("./kakao-auth/kakao/kakao");
const passportKakao = require("./kakao-auth");
const naverRouter = require("./naver-auth/naver/naver");
const passportNaver = require("./naver-auth/login");
const { swaggerUi, specs } = require("./swagger/swagger");
const connect = require("./schemas/index.schemas");
const postRouter = require("./routes/post.router");
const userRouter = require("./routes/user.router");
const reviewRouter = require("./routes/review.router");
const mypageRouter = require("./routes/mypage.router");
const likeRouter = require("./routes/like.router");
const blackListRouter = require("./routes/blackList.router");
const followRouter = require("./routes/follow.router");
const cors = require("cors");
//접속로그 남기기
// const requestMiddleware = (req, res, next) => {
//   console.log(
//     "ip:",
//     req.ip,
//     "domain:",
//     req.rawHeaders[1],
//     "method:",
//     req.method,
//     "Request URL:",
//     req.originalUrl,
//     "-",
//     new Date()
//   );
//   next();
// };
<<<<<<< HEAD
passportNaver();
passportKakao();
connect();
=======

passportNaver();
passportKakao();
connect();

>>>>>>> 71a4aa92f2a1b4176a1dc401dcaa353acbe0fca0
app.use(cors());
app.use(express.json());
// app.use(requestMiddleware);
app.use("/oauth", [kakaoRouter, naverRouter]);
app.use("/api", [
  userRouter,
  reviewRouter,
  mypageRouter,
  likeRouter,
  blackListRouter,
  postRouter,
  followRouter,
]);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
<<<<<<< HEAD
=======

>>>>>>> 71a4aa92f2a1b4176a1dc401dcaa353acbe0fca0
// 인증서 파트
// const privateKey = fs.readFileSync(__dirname + "/rusy7225_shop.key");
// const certificate = fs.readFileSync(__dirname + "/rusy7225_shop__crt.pem");
// const ca = fs.readFileSync(__dirname + "/rusy7225_shop__ca.pem");
// const credentials = {
//   key: privateKey,
//   cert: certificate,
//   ca: ca,
// };
<<<<<<< HEAD
=======

>>>>>>> 71a4aa92f2a1b4176a1dc401dcaa353acbe0fca0
// HTTP 리다이렉션 하기
// app_low : http전용 미들웨어
app_low.use((req, res, next) => {
  if (req.secure) {
    next();
  } else {
    const to = `https://${req.hostname}:${httpsPort}${req.url}`;
    console.log(to);
    res.redirect(to);
  }
});
// http: server.listen(port, () => {
//   console.log(port, "서버가 연결되었습니다.");
// });
// http.createServer(app_low).listen(httpPort, () => {
//   console.log("http " + httpPort + " server start");
// });
// https.createServer(credentials, app).listen(httpsPort, () => {
//   console.log("https " + httpsPort + " server start");
// });
<<<<<<< HEAD
// socket(server);
server.listen(httpPort, () => {
  console.log("http " + httpPort + " server start");
});
=======

socket(server);

server.listen(httpPort, () => {
  console.log("http " + httpPort + " server start");
});
>>>>>>> 71a4aa92f2a1b4176a1dc401dcaa353acbe0fca0
