import { Router } from "express";
import { authController } from "../controllers";
import validator from "../middleware/inputValidator";
const authRouter = Router();

authRouter.get("/login", authController.renderLogin);
authRouter.post("/login", validator.loginValidation(), authController.logIn);
authRouter.post("/logout", authController.logOut);
authRouter.get("/signup", authController.renderSignup);
authRouter.post("/signup", validator.signupValidation(), authController.signup);
authRouter.get("/reset/:resetToken", authController.renderNewPassword);
authRouter.post("/new-password", authController.updatePassword);
authRouter.get("/reset", authController.renderReset);
authRouter.post("/reset", authController.generateResetPasswordToken);

export default authRouter;
