import { Router } from "express";
import { shopController } from "../controllers";
import isAuthenticated from "../middleware/isAuthenticated";
const shopRouter = Router();

shopRouter.get("/", shopController.renderIndex);
shopRouter.get("/products", shopController.renderProductList);
shopRouter.get("/cart", isAuthenticated, shopController.renderCart);
shopRouter.post("/cart", isAuthenticated, shopController.addToCart);
shopRouter.get("/checkout", isAuthenticated, shopController.renderCheckout);
shopRouter.get("/checkout/success", isAuthenticated, shopController.CheckoutSuccess);
shopRouter.get("/checkout/cancel", isAuthenticated, shopController.renderCheckout);
shopRouter.get("/images/:key", shopController.fetchImage);
shopRouter.get("/orders", isAuthenticated, shopController.renderOrders);
shopRouter.get("/products/:id", shopController.renderProductDetails);
shopRouter.post("/cart-delete-item", isAuthenticated, shopController.deleteFromCart);
shopRouter.get("/orders/:orderId", isAuthenticated, shopController.getInvoice);
shopRouter.get("/checkout", isAuthenticated, shopController.renderCheckout);
export default shopRouter;
