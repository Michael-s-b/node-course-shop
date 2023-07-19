"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const isAuthenticated_1 = __importDefault(require("../middleware/isAuthenticated"));
const inputValidator_1 = __importDefault(require("../middleware/inputValidator"));
const adminRouter = (0, express_1.Router)();
adminRouter.get("/add-product", isAuthenticated_1.default, controllers_1.adminController.renderAdminAddProduct);
adminRouter.get("/products", isAuthenticated_1.default, controllers_1.adminController.renderAdminProductList);
adminRouter.post("/add-product", inputValidator_1.default.productValidator(), isAuthenticated_1.default, controllers_1.adminController.createProduct);
adminRouter.get("/edit-product/:productId", isAuthenticated_1.default, controllers_1.adminController.renderAdminEditProduct);
adminRouter.post("/edit-product/", inputValidator_1.default.productValidator(), isAuthenticated_1.default, controllers_1.adminController.editProduct);
adminRouter.delete("/product/:productId", isAuthenticated_1.default, controllers_1.adminController.deleteProduct);
exports.default = adminRouter;
