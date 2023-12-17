import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { startOfDay, endOfDay, subMonths } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

const router = express.Router();

/**
 * @swagger
 * tags:
 *    - name: Feeds
 *      description: 피드글 조회 API
 *    - name: Likes
 *      description: 좋아요 기능 API
 * 
 * @swagger
 * /feeds:
 *   get:
 *     tags:
 *       - Feeds
 *     summary: isPublic이 true인 피드 조회
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 표시하고자 하는 페이지 번호
 *         required: false
 *         type: integer
 *     responses:
 *        200:
 *          description: 피드 조회 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  data:
 *                    type: array
 *        400: 
 *          description: 피드 조회 실패 및 서버 에러
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 * 
 * @swagger
 * /feeds/mydiaries:
 *   get:
 *     tags:
 *       - Feeds
 *     summary: userId 기반 내 피드 조회
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 표시하고자 하는 페이지 번호
 *         required: false
 *         type: integer
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *     responses:
 *        200:
 *          description: 피드 조회 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  data:
 *                    type: array
 *        400: 
 *          description: 피드 조회 실패 및 서버 에러
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *              
 * @swagger
 * /feeds/:diaryId/like:
 *   post:
 *     tags:
 *       - Likes
 *     summary: 좋아요 및 좋아요 취소 기능
 *     parameters:
 *       - in: path
 *         name: diaryId
 *         schema:
 *           type: Integer
 *         required: true
 *         description: diaryId를 넣어주세요
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *     responses:
 *       '201':
 *         description: 좋아요 추가 및 삭제
 *         content:
 *           application/json:
 *             examples:
 *               added:
 *                 summary: 좋아요 추가
 *                 value:
 *                   message: "좋아요가 추가되었습니다."
 *                   data: 1
 *               removed:
 *                 summary: 좋아요 취소
 *                 value:
 *                   message: "좋아요가 취소되었습니다."
 *                   data: 0
 *       '400':
 *         description: diaryId가 잘못됐을때
 *         content:
 *           application/json:
 *             example:
 *               message: "해당하는 일기가 없습니다."  
 */

/* 피드 글 조회 */
router.get("/feeds", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;

    // 이전 페이지에서 마지막 데이터의 createdAt 값 가져오기 (데이터의 마지막 index값에 해당하는 value의 createdAt 값을 전달받는다)
    const lastCreatedAt = req.query.lastCreatedAt; // 클라이언트에서 전달된 마지막 데이터의 createdAt 값

    const today = new Date();
    const timeZone = "Asia/Seoul";
    const twoMonthsAgo = utcToZonedTime(
      startOfDay(subMonths(today, 2)),
      timeZone
    );
    const todaySeoulTime = utcToZonedTime(endOfDay(today), timeZone);


      const diaryEntries = await prisma.diaries.findMany({
          where: {
              isPublic : true,
              createdAt: {
                  gte: twoMonthsAgo, 
                  lte: todaySeoulTime,
                  // lastCreatedAt 값보다 큰 데이터만 가져오기 (중복 제거)
                  gt: lastCreatedAt ? new Date(lastCreatedAt) : undefined,
              }
          },
          take: pageSize,
          skip: page > 1 ? (page - 1) * pageSize : 0,
          orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ data: diaryEntries });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* 내 diary글 피드 글 조회 */
router.get("/feeds/mydiaries", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;

    // 이전 페이지에서 마지막 데이터의 createdAt 값 가져오기 (데이터의 마지막 index값에 해당하는 value의 createdAt 값을 전달받는다)
    const lastCreatedAt = req.query.lastCreatedAt; // 클라이언트에서 전달된 마지막 데이터의 createdAt 값

      const diaryEntries = await prisma.diaries.findMany({
          where: {
              UserId : userId,
              createdAt: {
                  gt: lastCreatedAt ? new Date(lastCreatedAt) : undefined,
              }
          },
          take: pageSize,
          skip: page > 1 ? (page - 1) * pageSize : 0,
          orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ data: diaryEntries });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});





// 피드에 좋아요 기능
router.post("/feeds/:diaryId/like", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { diaryId } = req.params;

    const existsLike = await prisma.diaryLikes.findFirst({
      where: { DiaryId: +diaryId, UserId: +userId },
    });
    const existsDiary = await prisma.diaries.findFirst({
      where: { diaryId: +diaryId },
    });
    if (!existsDiary) {
      return res.status(400).json({ message: "해당하는 일기가 없습니다." });
    } else {
      if (existsLike) {
        await prisma.diaryLikes.delete({
          where: {
            diarylikeId: existsLike.diarylikeId,
            DiaryId: +diaryId,
            UserId: +userId,
          },
        });

        const islike = await prisma.diaries.update({
          where: { diaryId: +diaryId },
          data: {
            likeCount: {
              decrement: 1,
            },
          },
        });
        return res.status(200).json({message: "좋아요가 취소되었습니다.",data: islike.likeCount});
      }
      await prisma.diaryLikes.create({
        data: {
          UserId: +userId,
          DiaryId: +diaryId,
        },
      });
      const likeClick = await prisma.diaries.update({
        where: { diaryId: +diaryId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      });
      return res.status(201).json({message: "좋아요가 추가되었습니다.",data: likeClick.likeCount});
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버오류" });
  }
});

// /* 피드 조회 => 피드만 조회할 뿐 이에 연결된 댓글은 조회되지 않는다. (갯수만 조회하고 클릭하면 댓글을 조회하는 형식) */
// router.get('/feeds', async (req, res, next) => {
//     try {
//         const page = req.query.page ? parseInt(req.query.page) : 1;
//         const perPage = 10;
//         const feeds = await prisma.diaries.findMany({
//           where: { isPublic: true },
//           orderBy: { createdAt: 'desc' },
//           skip: (page - 1) * perPage,
//           take: perPage,
//         });
//         res.json(feeds);
//       } catch (err) {
//         res.status(400).json({ message: err.message });
//       }
// })
// // 피드를 새롭게 조회중에 db에 새로운 diary가 추가 될 경우 새롭게 호출하는 db의 순번이 바뀌어 중복된 feed가 출력될 수 있다
// // 이를 해결할 방법을 고민해봐야함. 일단은 프론트와 논의되기 전까지의 뼈대코드
export default router;