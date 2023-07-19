import { Router } from "express";
import { errorController } from "../controllers";
const errorRouter = Router();
errorRouter.get("/500", errorController.get500);
errorRouter.get("/403", errorController.get403);
errorRouter.get("/404", errorController.get404);
export default errorRouter;
