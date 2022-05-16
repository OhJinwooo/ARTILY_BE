require("dotenv").config();
const Review = require("../../schemas/review.schemas");
const ReviewImages = require("../../schemas/reviewImage.schemas");
const Post = require("../../schemas/post.schemas");
const User = require("../../schemas/user.schemas");
const moment = require("moment");
const s3 = require("../config/s3");
const { v4 } = require("uuid");
const uuid = () => {
  const tokens = v4().split("-");
  return tokens[2] + tokens[1] + tokens[3];
};

// 리뷰 조회(무한 스크롤)
const review = async (req, res) => {
  try {
    const data = req.query;
    //infinite scroll 핸들링
    // 변수 선언 값이 정수로 표현
    let page = Math.max(1, parseInt(data.page));
    let limit = Math.max(1, parseInt(data.limit));
    //NaN일때 값지정 ??
    page = !isNaN(page) ? page : 1;
    limit = !isNaN(limit) ? limit : 6;
    //제외할 데이터 지정 == 다음 페이지 시작점
    let skip = (page - 1) * limit;

    //다음페이지가 없으면 없다고 프론트에 전해주기

    const reviews = await Review.find(
      {},
      "reviewId nickname profileImage reviewTitle reviewContent imageUrl likeCnt seller.category"
    )
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);
    if (reviews.length) {
      for (let review of reviews) {
        const images = await ReviewImages.findOne({
          reviewId: review.reviewId,
        });
        console.log("images", images);
        review.imageUrl = images;
      }
    }
    res.json({ reviews });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
// 리뷰 상세조회
const review_detail = async (req, res) => {
  try {
    const { reviewId } = req.params;
    // console.log(reviewId);

    //리뷰를 작성한 user 정보
    //구매한 작품&작가 정보 찾기
    let buyer = await Review.find({ reviewId });
    console.log("buyer", buyer);
    let s_userId = "";
    if (buyer.length) {
      for (let review of buyer) {
        const images = await ReviewImages.find({ reviewId: review.reviewId });
        console.log("images", images);
        review.imageUrl = images;
      }
      s_userId = buyer[0].seller.user.userId;
      console.log("s_userId", s_userId);

      //내가 구매한 작가의 다른 작품들 찾기
      let defferents = await Post.find(
        { "user.userId": s_userId },
        "postId postTitle price"
      );
      console.log("defferents", defferents);

      // 판매자의 물품들(postId)
      let seller_postId = [];
      let defferent = "";
      if (defferents) {
        for (let i = 0; i < defferents.length; i++) {
          seller_postId.push(defferents[i].postId);
        }

        console.log("seller_postId", seller_postId);

        defferent = seller_postId.filter((qq) => qq !== buyer[0].seller.postId);
      }
      res.json({ buyer, defferents });
    } else {
      return res.send({ msg: "해당 게시글이 없습니다." });
    }
  } catch (err) {
    console.log("상제조회 에러");
    res.status(400).send({ msg: "리뷰상세보기가 조회되지 않았습니다." });
  }
};
//리뷰 작성
const review_write = async (req, res) => {
  // middlewares유저정보 가져오기
  const { user } = res.locals;
  const { userId } = user;
  const { nickname } = user;
  const { profileImage } = user;
  const { postId } = req.params;
  let seller = await Post.findOne(
    { postId },
    "category postId postTitle price imageUrl user.userId user.nickname user.profileImage"
  );

  console.log("ss", seller);
  //작성한 정보 가져옴
  const { reviewTitle, reviewContent } = req.body;
  if (!reviewTitle || !reviewContent) {
    return res.send({ msg: "내용을 입력해주세요" });
  }
  console.log(reviewTitle, reviewContent); //ok

  const reviewId = uuid();

  // 이미지에서 location정보만 저장해줌
  if (req.files.length) {
    for (let i = 0; i < req.files.length; i++) {
      await ReviewImages.create({
        reviewId,
        imageId: uuid(),
        imageNumber: i,
        imageUrl: req.files[i].location,
      });
    }
  }

  // 리뷰작성시각 생성
  require("moment-timezone");
  moment.tz.setDefault("Asia/Seoul");
  const createdAt = String(moment().format("YYYY-MM-DD HH:mm:ss"));

  try {
    const ReviewList = await Review.create({
      reviewId,
      seller,
      userId,
      nickname,
      profileImage,
      reviewTitle,
      reviewContent,
      createdAt,
    });
    res.status(200).json({
      respons: "success",
      ReviewList,
    });
  } catch {
    res.status(400).send({ msg: "리뷰가 작성되지 않았습니다." });
  }
};

//리뷰 수정
const review_modify = async (req, res) => {
  //try {
  //수정할 reviewID 파라미터로 받음
  const { reviewId } = req.params;
  //수정할 값 body로 받음
  const { reviewTitle, reviewContent } = req.body;
  //게시글 내용이 없으면 저장되지 않고 alert 뜨게하기.
  if (!reviewTitle || !reviewContent) {
    return res.send({ msg: "내용을 입력해주세요" });
  }
  // 수정 이미지 URL 가져오기
  const imageUrl = req.files;
  console.log("수정이미지", imageUrl);
  // 수정 이미지 하나씩 빼서 배열에 저장
  let img_new = [];
  for (let i = 0; i < imageUrl.length; i++) {
    img_new.push(imageUrl[i].location);
  }
  console.log("img_new", img_new);

  // 기존 이미지 URL 가져오기
  const reviewImage = await ReviewImages.find({ reviewId });
  console.log("reviewImage", reviewImage); //ok
  // 기존 이미지 하나씩 빼서 배열에 저장
  let img = [];
  for (let i = 0; i < reviewImage.length; i++) {
    img.push(reviewImage[i].imageUrl);
  }
  console.log("img", img);

  //기존 이미지들과 수정 이미지들의 값이 다르면 기존 이미지 삭제한 후 수정 이미지로 변경.
  if (img_new !== img) {
    //기존 이미지 삭제하기 위한 key값 추출
    const deleteItems = [];
    for (let i = 0; i < img.length; i++) {
      //key값을 string으로 지정
      deleteItems.push({ Key: String(img[i].split("/")[3]) });
    }
    //s3에서 기존 이미지 삭제하기
    let params = {
      Bucket: process.env.BUCKETNAME,
      Delete: {
        Objects: deleteItems,
        Quiet: false,
      },
    };
    //s3 delete 실행
    s3.deleteObjects(params, function (err, data) {
      if (err) console.log(err);
      else console.log("Successfully deleted myBucket/myKey");
    });
    //s3에 수정이미지 업데이트해주기
    await ReviewImages.updateOne({ reviewId }, { $set: { img } });
  }
  // 이미지를 제외한 값들 수정
  await Review.updateOne(
    { reviewId },
    {
      $set: {
        reviewTitle,
        reviewContent,
      },
    }
  );
  res.status(200).send({
    respons: "success",
    msg: "수정 완료",
  });
  // } catch (error) {
  //   res.status(400).send({
  //     respons: "fail",
  //     msg: "수정 실패",
  //   });
  // }
};
//리뷰 삭제
const review_delete = async (req, res) => {
  const { reviewId } = req.params;
  const { userId } = res.locals.user;
  try {
    // 해당 유저와 리뷰가 있는지 확인
    const reviewUser = await Review.findOne({ userId, reviewId }).exec();
    if (reviewUser) {
      // 이미지 URL 가져오기 위한 로직
      const reviewImage = await ReviewImages.find({ reviewId });
      // 복수의 이미지를 삭제 변수(array)
      let deleteItems = [];
      if (reviewImage.length) {
        for (let i = 0; i < reviewImage.length; i++) {
          deleteItems.push({
            Key: String(reviewImage[i].imageUrl.split("/")[3]),
          });
        }
        //삭제를 위한 변수
        let params = {
          //bucket 이름
          Bucket: process.env.BUCKETNAME,
          //delete를 위한 key값
          Delete: {
            Objects: deleteItems,
            Quiet: false,
          },
        };
        //복수의 delete를 위한 코드 변수(params를 받음)
        s3.deleteObjects(params, function (err, data) {
          if (err) console.log(err);
          else console.log("Successfully deleted myBucket/myKey");
        });
        await ReviewImages.deleteMany({ reviewId });
      }
      //delete
      await Review.deleteOne({ reviewId, userId });
      res.status(200).send({
        respons: "success",
        msg: "삭제 완료",
      });
    } else {
      return res.status(400).send({ msg: "해당 게시글이 없습니다." });
    }
  } catch (error) {
    res.status(400).send({
      respons: "fail",
      msg: "삭제 실패",
    });
  }
};

module.exports = {
  review,
  review_detail,
  review_write,
  review_modify,
  review_delete,
};
