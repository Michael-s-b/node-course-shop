"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const order_1 = __importDefault(require("./order"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    cart: {
        items: {
            type: [
                {
                    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
                    quantity: { type: Number, required: true },
                },
            ],
            default: [], // set default value to empty array
        },
    },
    resetToken: {
        type: String,
        default: undefined,
    },
    resetTokenExpiration: {
        type: Date,
        default: undefined,
    },
}, { timestamps: true });
userSchema.method("addToCart", async function (product) {
    try {
        let newQuantity = 1;
        let updatedCartItems;
        if (this.cart) {
            const cartProductIndex = this.cart.items.findIndex((cartProduct) => {
                return cartProduct.productId.toString() === product._id.toString(); // check if the cart already has the product
            });
            updatedCartItems = [...this.cart.items];
            if (cartProductIndex >= 0) {
                newQuantity = this.cart.items[cartProductIndex].quantity + 1;
                updatedCartItems[cartProductIndex].quantity = newQuantity;
            }
            else {
                updatedCartItems.push({ productId: product._id, quantity: newQuantity });
            }
        }
        else {
            const newCart = { items: [{ productId: product._id, quantity: newQuantity }] };
            this.cart = newCart;
            return await this.save();
        }
        const updatedCart = { items: updatedCartItems };
        this.cart = updatedCart;
        return await this.save();
    }
    catch (error) {
        throw error;
    }
});
userSchema.method("removeFromCart", async function (productId) {
    try {
        const updatedCartItems = this.cart.items.filter((item) => {
            return item.productId.toString() !== productId.toString();
        });
        this.cart.items = updatedCartItems;
        return this.save();
    }
    catch (error) {
        throw error;
    }
});
userSchema.method("addOrder", async function () {
    const user = await this.populate("cart.items.productId"); //user with populated cart items
    let totalPrice = 0;
    user.cart.items.forEach((item) => {
        totalPrice += item.productId.price * item.quantity;
    });
    console.log(user.cart.items);
    const orderItems = user.cart.items.map((item) => {
        return { product: item.productId, quantity: item.quantity };
    });
    const newOrder = new order_1.default({ user: { name: this.email, userId: this }, items: orderItems, totalPrice });
    this.cart = { items: [] };
    this.save();
    return await newOrder.save();
});
userSchema.method("getOrders", async function () {
    return await order_1.default.find({ "user.userId": this._id });
});
const User = (0, mongoose_1.model)("User", userSchema);
exports.default = User;
