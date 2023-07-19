"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const inputValidator_1 = __importDefault(require("../middleware/inputValidator"));
const authRouter = (0, express_1.Router)();
authRouter.get("/login", controllers_1.authController.renderLogin);
authRouter.post("/login", inputValidator_1.default.loginValidation(), controllers_1.authController.logIn);
authRouter.post("/logout", controllers_1.authController.logOut);
authRouter.get("/signup", controllers_1.authController.renderSignup);
authRouter.post("/signup", inputValidator_1.default.signupValidation(), controllers_1.authController.signup);
authRouter.get("/reset/:resetToken", controllers_1.authController.renderNewPassword);
authRouter.post("/new-password", controllers_1.authController.updatePassword);
authRouter.get("/reset", controllers_1.authController.renderReset);
authRouter.post("/reset", controllers_1.authController.generateResetPasswordToken);
exports.default = authRouter;
