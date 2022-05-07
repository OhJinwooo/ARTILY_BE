const express = require("express");
const router = express.Router();
const upload = require("./multer/uploads");
const middleware = require("../middleware/authMiddleware");
const {
  artPost,
  artDetail,
  artStore,
  artUpdate,
  getHome,
  artdelete,
  marckupCnt,
} = require("./controllers/post.controllers");

//홈 조회
router.get("/post", getHome);

//스토어 조회
router.get("/post/store", artStore);

//상세페이지 조회
router.get("/post/:postId", middleware, artDetail);

//작품 등록
router.post("/post", middleware, upload.array("imageUrl", 10), artPost);

//작품 판매글 수정
router.patch(
  "/post/:postId",
  middleware,
  upload.array("imageUrl", 10),
  artUpdate
);

//작품 판매글 삭제
router.delete("/post/:postId", middleware, artdelete);

//작품 찜하기
router.post("/markup/:postId", middleware, marckupCnt);

module.exports = router;
