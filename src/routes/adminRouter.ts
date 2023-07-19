import { Router } from "express";
import { adminController } from "../controllers";
import isAuthenticated from "../middleware/isAuthenticated";
import validator from "../middleware/inputValidator";
const adminRouter = Router();

adminRouter.get("/add-product", isAuthenticated, adminController.renderAdminAddProduct);
adminRouter.get("/products", isAuthenticated, adminController.renderAdminProductList);
adminRouter.post("/add-product", validator.productValidator(), isAuthenticated, adminController.createProduct);
adminRouter.get("/edit-product/:productId", isAuthenticated, adminController.renderAdminEditProduct);
adminRouter.post("/edit-product/", validator.productValidator(), isAuthenticated, adminController.editProduct);
adminRouter.delete("/product/:productId", isAuthenticated, adminController.deleteProduct);

export default adminRouter;
