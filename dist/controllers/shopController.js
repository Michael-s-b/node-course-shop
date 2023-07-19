"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const http_errors_1 = __importDefault(require("http-errors"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const lodash_1 = require("lodash");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_API_KEY, {
    apiVersion: "2022-11-15",
});
let currentPage = 1;
let itemsPerPage = 4;
const renderProductList = async (req, res, next) => {
    try {
        if (req.query.page) {
            currentPage = (0, lodash_1.toInteger)(req.query.page);
        }
        const productsCount = await models_1.Product.countDocuments();
        const pagesAmount = Math.ceil(productsCount / itemsPerPage);
        const products = await models_1.Product.find()
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);
        return res.render("shop/product-list", {
            pagesAmount: pagesAmount,
            currentPage: currentPage,
            products: products,
            pageTitle: "Products",
            path: "/products",
            totalProducts: productsCount,
            hasNextPage: itemsPerPage * currentPage < productsCount,
            hasPreviousPage: currentPage > 1,
            nextPage: currentPage + 1,
            previousPage: currentPage - 1,
            lastPage: Math.ceil(productsCount / itemsPerPage),
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const renderCart = async (req, res, next) => {
    const user = req.user;
    if (user) {
        try {
            const userPopulated = await user.populate("cart.items.productId");
            const products = userPopulated.cart.items;
            return res.render("shop/cart", {
                path: "/cart",
                pageTitle: "Your Cart",
                products: products,
            });
        }
        catch (err) {
            return next(new Error(err));
        }
    }
};
const renderIndex = async (req, res, next) => {
    try {
        if (req.query.page) {
            currentPage = (0, lodash_1.toInteger)(req.query.page);
        }
        const productsCount = await models_1.Product.countDocuments();
        const pagesAmount = Math.ceil(productsCount / itemsPerPage);
        const products = await models_1.Product.find()
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);
        return res.render("shop/index", {
            pagesAmount: pagesAmount,
            currentPage: currentPage,
            products: products,
            pageTitle: "Shop",
            path: "/",
            totalProducts: productsCount,
            hasNextPage: itemsPerPage * currentPage < productsCount,
            hasPreviousPage: currentPage > 1,
            nextPage: currentPage + 1,
            previousPage: currentPage - 1,
            lastPage: Math.ceil(productsCount / itemsPerPage),
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const renderOrders = async (req, res, next) => {
    const user = req.user;
    try {
        if (user) {
            const orders = await user.getOrders();
            // console.log(orders);
            return res.render("shop/orders", {
                path: "/orders",
                pageTitle: "Your Orders",
                orders: orders,
            });
        }
    }
    catch (err) {
        return next(new Error(err));
    }
};
const renderProductDetails = async (req, res, next) => {
    const id = req.params.id;
    try {
        const product = await models_1.Product.findById(id);
        res.render("shop/product-detail", {
            product: product,
            pageTitle: product?.title,
            path: "/product-detail",
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const addToCart = async (req, res, next) => {
    const productId = req.body.productId;
    const user = req.user;
    if (user) {
        try {
            const product = await models_1.Product.findById(productId);
            if (product) {
                const result = await user.addToCart(product);
            }
            return res.redirect("/cart");
        }
        catch (err) {
            return next(new Error(err));
        }
    }
};
const deleteFromCart = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        if (user) {
            const result = await user.removeFromCart(productId);
            return res.redirect("/cart");
        }
        return res.redirect("/");
    }
    catch (err) {
        return next(new Error(err));
    }
};
const CheckoutSuccess = async (req, res, next) => {
    try {
        const user = req.user;
        if (user) {
            const result = await user.addOrder();
            // console.log(result);
            return res.redirect("/orders");
        }
    }
    catch (err) {
        return next(new Error(err));
    }
};
const getInvoice = async (req, res, next) => {
    const orderId = req.params.orderId;
    const invoiceName = "invoice-" + orderId + ".pdf";
    const invoicePath = path_1.default.join("data", "invoices", invoiceName);
    try {
        const foundOrder = await models_1.Order.findById(orderId);
        if (!foundOrder) {
            console.log("no order found");
            return next((0, http_errors_1.default)(404, "Order not found"));
        }
        if (foundOrder.user.userId.toString() !== req.user?._id.toString()) {
            console.log("user id does not match");
            return next((0, http_errors_1.default)(403, "Forbidden access"));
        }
        console.log("user id matches");
        const pdfDoc = new pdfkit_1.default();
        pdfDoc.pipe(fs_1.default.createWriteStream(invoicePath));
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
        pdfDoc.pipe(res);
        pdfDoc.fontSize(26).text("Invoice", { underline: true });
        pdfDoc.moveDown();
        pdfDoc.fontSize(14);
        pdfDoc.text(`Order ID: ${foundOrder._id}`);
        pdfDoc.text(`Date: ${new Date().toLocaleDateString()}`);
        pdfDoc.text(`Customer: ${foundOrder.user.name}`);
        pdfDoc.moveDown();
        pdfDoc.fontSize(16).text("Order Items", { underline: true });
        pdfDoc.moveDown();
        foundOrder.items.forEach((item) => {
            pdfDoc.fontSize(12).text("------------------------------------------------------");
            pdfDoc.text(`Product: ${item.product.title}`);
            pdfDoc.text(`Price: $${item.product.price.toFixed(2)}`);
            pdfDoc.text(`Quantity: ${item.quantity}`);
            pdfDoc.text(`Total: $${(item.product.price * item.quantity).toFixed(2)}`);
            pdfDoc.moveDown();
        });
        pdfDoc.fontSize(12).text("------------------------------------------------------");
        pdfDoc.moveDown();
        pdfDoc.fontSize(16).text(`Total: $${foundOrder.totalPrice.toFixed(2)}`, { underline: true });
        return pdfDoc.end();
    }
    catch (err) {
        return next(err);
    }
};
const renderCheckout = async (req, res, next) => {
    try {
        let products;
        let total = 0;
        const userPopulated = await req.user.populate("cart.items.productId");
        products = userPopulated.cart.items;
        products.forEach((product) => {
            total += product.quantity * product.productId.price;
        });
        const session = await stripe.checkout.sessions.create({
            success_url: req.protocol + "://" + req.get("host") + "/checkout/success",
            cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
            payment_method_types: ["card"],
            mode: "payment",
            line_items: products.map((product) => {
                return {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: product.productId.title,
                            description: product.productId.description,
                        },
                        unit_amount: product.productId.price * 100, // Price in cents
                    },
                    quantity: product.quantity,
                };
            }),
        });
        res.render("shop/checkout", {
            path: "/checkout",
            pageTitle: "Checkout",
            products: products,
            totalSum: total,
            sessionId: session.id,
        });
    }
    catch (err) {
        next((0, http_errors_1.default)(500, err));
    }
};
exports.default = {
    renderCart,
    renderProductList,
    renderIndex,
    renderCheckout,
    renderOrders,
    renderProductDetails,
    addToCart,
    deleteFromCart,
    CheckoutSuccess,
    getInvoice,
};
