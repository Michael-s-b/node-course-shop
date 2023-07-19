"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const http_errors_1 = __importDefault(require("http-errors"));
const aws_s3_config_1 = require("../aws.s3.config");
const renderAdminProductList = async (req, res, next) => {
    try {
        const products = await models_1.Product.find({ userId: req.user?._id });
        res.render("admin/products", {
            products: products,
            pageTitle: "Admin Product List",
            path: "/admin/products",
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const renderAdminAddProduct = (req, res, next) => {
    try {
        res.render("admin/edit-product", {
            pageTitle: "Admin Create Product",
            path: "/admin/add-product",
            editing: false,
            hasError: false,
            errorMessage: null,
            validationErrors: [],
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const renderAdminEditProduct = async (req, res, next) => {
    const editMode = req.query.edit;
    const productId = new mongodb_1.ObjectId(req.params.productId);
    try {
        if (!editMode) {
            return res.redirect("/");
        }
        const product = await models_1.Product.findById(productId);
        if (!product)
            return res.redirect("/");
        res.render("admin/edit-product", {
            pageTitle: "Admin Edit Product",
            path: "/admin/edit-product",
            editing: editMode,
            hasError: false,
            errorMessage: null,
            product: product,
            validationErrors: [],
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const editProduct = async (req, res, next) => {
    const { productId, title, description, price } = req.body;
    const tempImage = req.file;
    const imageUrl = tempImage?.path;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const foundProduct = await models_1.Product.findById(productId);
        if (!foundProduct) {
            return (0, http_errors_1.default)(404, "Product not found");
        }
        // Build an object with the fields to be updated
        const updatedFields = {};
        if (title) {
            updatedFields.title = title;
        }
        if (tempImage) {
            const key = foundProduct.imageUrl.replace("images/", "");
            const result = await (0, aws_s3_config_1.deleteFromS3)(key);
            const sendFile = await (0, aws_s3_config_1.uploadToS3)(tempImage);
            updatedFields.imageUrl = "images/" + sendFile.Key;
        }
        if (description) {
            updatedFields.description = description;
        }
        if (price) {
            updatedFields.price = price;
        }
        // Update the product with the new values
        const result = await models_1.Product.updateOne({ _id: productId, userId: req.user?.id }, updatedFields, {
            strict: true,
        });
        res.redirect("/admin/products");
        console.log(result);
    }
    catch (err) {
        return next(new Error(err));
    }
};
const createProduct = async (req, res, next) => {
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
        const errors = (0, express_validator_1.validationResult)(req);
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
        const sendFile = await (0, aws_s3_config_1.uploadToS3)(tempImage);
        const newProduct = new models_1.Product({
            title,
            imageUrl: "images/" + sendFile.Key,
            description: description,
            price: price,
            userId: req.user,
        });
        const result = await newProduct.save();
        return res.status(201).redirect("/admin/products");
    }
    catch (err) {
        return next(new Error(err));
    }
};
const deleteProduct = async (req, res, next) => {
    const { productId } = req.params;
    try {
        const deletedDoc = await models_1.Product.findOneAndDelete({ _id: productId, userId: req.user?.id });
        if (deletedDoc) {
            const key = deletedDoc.imageUrl.replace("images/", "");
            const result = await (0, aws_s3_config_1.deleteFromS3)(key);
        }
        res.status(200).json({
            message: "File deleted successfully",
        });
    }
    catch (err) {
        res.status(500).json({
            message: "Deleting product failed",
        });
    }
};
exports.default = {
    renderAdminAddProduct,
    createProduct,
    renderAdminProductList,
    renderAdminEditProduct,
    editProduct,
    deleteProduct,
};
