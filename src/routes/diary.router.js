import express from "express"
import { DiaryController } from '../controllers/diary.controller.js'
import { upload } from '../middleware/S3.upload/multer.js'
import authMiddleware from "../middleware/auth.middleware.js";
import { upload } from '../middleware/S3.upload/multer.js'

const router = express.Router();

const diaryController = new DiaryController()

router.get('/diary/detail/:diaryId', authMiddleware, diaryController.getDiary)
router.post('/diary/posting', authMiddleware, upload.single('image'), diaryController.postDiary)
router.patch('/diary/edit/:diaryId', authMiddleware, diaryController.updateDiary)
router.delete('/diary/delete/:diaryId', authMiddleware, diaryController.deleteDiary)

export default router;