"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const errorRouter = (0, express_1.Router)();
errorRouter.get("/500", controllers_1.errorController.get500);
errorRouter.get("/403", controllers_1.errorController.get403);
errorRouter.get("/404", controllers_1.errorController.get404);
exports.default = errorRouter;
