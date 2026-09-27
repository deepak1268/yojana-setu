import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
    getBookmarks,
    addBookmark,
    deleteBookmark,
} from "../controllers/bookmarkController";

const bookmarkRouter = Router();

// All bookmark routes require authentication
bookmarkRouter.use(authMiddleware);

bookmarkRouter.get("/", getBookmarks);
bookmarkRouter.post("/", addBookmark);
bookmarkRouter.delete("/:schemeId", deleteBookmark);

export default bookmarkRouter;
