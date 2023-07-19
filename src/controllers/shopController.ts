import { NextFunction, Request, Response } from "express";
import { Order, Product, User } from "../models";
import fs from "fs";
import path from "path";
import createError, { UnknownError } from "http-errors";
import PDFDocument, { page } from "pdfkit";
import { toInteger } from "lodash";
import Stripe from "stripe";
import { downloadFromS3 } from "../aws.s3.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY as string, {
	apiVersion: "2022-11-15",
});
let currentPage = 1;
let itemsPerPage = 4;
interface UserWithPopulatedCartItems {
	cart: {
		items: {
			productId: InstanceType<typeof Product>;
			quantity: number;
		}[];
	};
}

const renderProductList = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (req.query.page) {
			currentPage = toInteger(req.query.page);
		}
		const productsCount = await Product.countDocuments();
		const pagesAmount = Math.ceil(productsCount / itemsPerPage);
		const products = await Product.find()
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
	} catch (err) {
		return next(new Error(err as any));
	}
};

const renderCart = async (req: Request, res: Response, next: NextFunction) => {
	const user = req.user;
	if (user) {
		try {
			const userPopulated = await user.populate<UserWithPopulatedCartItems>("cart.items.productId");
			const products = userPopulated.cart.items;
			return res.render("shop/cart", {
				path: "/cart",
				pageTitle: "Your Cart",
				products: products,
			});
		} catch (err) {
			return next(new Error(err as any));
		}
	}
};

const renderIndex = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (req.query.page) {
			currentPage = toInteger(req.query.page);
		}
		const productsCount = await Product.countDocuments();
		const pagesAmount = Math.ceil(productsCount / itemsPerPage);
		const products = await Product.find()
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
	} catch (err) {
		return next(new Error(err as any));
	}
};

const renderOrders = async (req: Request, res: Response, next: NextFunction) => {
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
	} catch (err) {
		return next(new Error(err as any));
	}
};

const renderProductDetails = async (req: Request, res: Response, next: NextFunction) => {
	const id = req.params.id;
	try {
		const product = await Product.findById(id);
		res.render("shop/product-detail", {
			product: product,
			pageTitle: product?.title,

			path: "/product-detail",
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const addToCart = async (req: Request, res: Response, next: NextFunction) => {
	const productId = req.body.productId;
	const user = req.user;
	if (user) {
		try {
			const product = await Product.findById(productId);
			if (product) {
				const result = await user.addToCart(product);
			}
			return res.redirect("/cart");
		} catch (err) {
			return next(new Error(err as any));
		}
	}
};

const deleteFromCart = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { productId } = req.body;
		const user = req.user;
		if (user) {
			const result = await user.removeFromCart(productId);
			return res.redirect("/cart");
		}
		return res.redirect("/");
	} catch (err) {
		return next(new Error(err as any));
	}
};

const CheckoutSuccess = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = req.user;
		if (user) {
			const result = await user.addOrder();
			// console.log(result);
			return res.redirect("/orders");
		}
	} catch (err) {
		return next(new Error(err as any));
	}
};

const getInvoice = async (req: Request, res: Response, next: NextFunction) => {
	const orderId = req.params.orderId;
	const invoiceName = "invoice-" + orderId + ".pdf";
	const invoicePath = path.join("data", "invoices", invoiceName);
	try {
		const foundOrder = await Order.findById(orderId);
		if (!foundOrder) {
			console.log("no order found");
			return next(createError(404, "Order not found"));
		}
		if (foundOrder.user.userId.toString() !== req.user?._id.toString()) {
			console.log("user id does not match");
			return next(createError(403, "Forbidden access"));
		}
		console.log("user id matches");

		const pdfDoc = new PDFDocument();
		pdfDoc.pipe(fs.createWriteStream(invoicePath));
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
	} catch (err) {
		return next(err);
	}
};

const renderCheckout = async (req: Request, res: Response, next: NextFunction) => {
	try {
		let products;
		let total = 0;
		const userPopulated = await req.user!.populate<UserWithPopulatedCartItems>("cart.items.productId");
		products = userPopulated.cart.items;
		products.forEach((product) => {
			total += product.quantity * product.productId.price;
		});

		const session = await stripe.checkout.sessions.create({
			success_url: req.protocol + "://" + req.get("host") + "/checkout/success",
			cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
			payment_method_types: ["card"],
			mode: "payment", // Add the mode parameter here
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
	} catch (err) {
		next(createError(500, err as UnknownError));
	}
};

const fetchImage = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const key = req.params.key;
		const readStream = downloadFromS3(key);
		readStream.on("error", (error: any) => {
			res.redirect("/404");
		});
		res.contentType("image/jpeg");
		readStream.pipe(res);
	} catch (err) {
		next(createError(500, err as UnknownError));
	}
};

export default {
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
	fetchImage,
};
