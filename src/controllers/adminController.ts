import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { Product } from "../models";
import { validationResult } from "express-validator";
import createError from "http-errors";
import { deleteFromS3, s3, uploadToS3 } from "../aws.s3.config";

const renderAdminProductList = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const products = await Product.find({ userId: req.user?._id });
		res.render("admin/products", {
			products: products,
			pageTitle: "Admin Product List",
			path: "/admin/products",
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const renderAdminAddProduct = (req: Request, res: Response, next: NextFunction) => {
	try {
		res.render("admin/edit-product", {
			pageTitle: "Admin Create Product",
			path: "/admin/add-product",
			editing: false,
			hasError: false,
			errorMessage: null,
			validationErrors: [],
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const renderAdminEditProduct = async (req: Request, res: Response, next: NextFunction) => {
	const editMode = req.query.edit;
	const productId = new ObjectId(req.params.productId);
	try {
		if (!editMode) {
			return res.redirect("/");
		}
		const product = await Product.findById(productId);
		if (!product) return res.redirect("/");
		res.render("admin/edit-product", {
			pageTitle: "Admin Edit Product",
			path: "/admin/edit-product",
			editing: editMode,
			hasError: false,
			errorMessage: null,
			product: product,
			validationErrors: [],
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const editProduct = async (req: Request, res: Response, next: NextFunction) => {
	const { productId, title, description, price } = req.body;
	const tempImage = req.file;
	const imageUrl = tempImage?.path;

	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).render("admin/edit-product", {
				pageTitle: "Admin Create Product",
				path: "/admin/add-product",
				editing: true,
				hasError: true,
				errorMessage: errors.array()[0].msg,
				validationErrors: errors.array(),
				product: {
					title: title,
					price: price,
					description: description,
					_id: productId,
				},
			});
		}
		const foundProduct = await Product.findById(productId);
		if (!foundProduct) {
			return createError(404, "Product not found");
		}
		// Build an object with the fields to be updated
		const updatedFields: any = {};
		if (title) {
			updatedFields.title = title;
		}
		if (tempImage) {
			const key = foundProduct.imageUrl.replace("images/", "");
			const result = await deleteFromS3(key);
			const sendFile = await uploadToS3(tempImage);
			updatedFields.imageUrl = "images/" + sendFile.Key;
		}
		if (description) {
			updatedFields.description = description;
		}
		if (price) {
			updatedFields.price = price;
		}
		// Update the product with the new values
		const result = await Product.updateOne({ _id: productId, userId: req.user?.id }, updatedFields, {
			strict: true,
		});
		res.redirect("/admin/products");
		console.log(result);
	} catch (err) {
		return next(new Error(err as any));
	}
};

const createProduct = async (req: Request, res: Response, next: NextFunction) => {
	const { title, description, price } = req.body;
	const tempImage = req.file;
	try {
		if (!tempImage) {
			return res.status(422).render("admin/edit-product", {
				pageTitle: "Admin Create Product",
				path: "/admin/add-product",
				editing: false,
				hasError: true,
				errorMessage: "Attached file is not an image.",
				validationErrors: [],
				product: {
					title: title,
					// image: image,
					price: price,
					description: description,
				},
			});
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).render("admin/edit-product", {
				pageTitle: "Admin Create Product",
				path: "/admin/add-product",
				editing: false,
				hasError: true,
				errorMessage: errors.array()[0].msg,
				validationErrors: errors.array(),
				product: {
					title: title,
					// image: image,
					price: price,
					description: description,
				},
			});
		}
		const sendFile = await uploadToS3(tempImage);
		const newProduct = new Product({
			title,
			imageUrl: "images/" + sendFile.Key,
			description: description,
			price: price,
			userId: req.user,
		});
		const result = await newProduct.save();
		return res.status(201).redirect("/admin/products");
	} catch (err) {
		return next(new Error(err as any));
	}
};

const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
	const { productId } = req.params;
	try {
		const deletedDoc = await Product.findOneAndDelete({ _id: productId, userId: req.user?.id });
		if (deletedDoc) {
			const key = deletedDoc.imageUrl.replace("images/", "");
			const result = await deleteFromS3(key);
		}
		res.status(200).json({
			message: "File deleted successfully",
		});
	} catch (err) {
		res.status(500).json({
			message: "Deleting product failed",
		});
	}
};

export default {
	renderAdminAddProduct,
	createProduct,
	renderAdminProductList,
	renderAdminEditProduct,
	editProduct,
	deleteProduct,
};
