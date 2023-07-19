"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const product_1 = require("./product");
const orderSchema = new mongoose_1.Schema({
    user: {
        name: { type: String, required: true },
        userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    },
    items: [
        {
            product: { type: product_1.productSchema, required: true },
            quantity: { type: Number, required: true },
        },
    ],
    totalPrice: { type: Number, required: true },
});
// orderSchema.method("addOrder", async function (this: InstanceType<typeof Order>) {});
const Order = (0, mongoose_1.model)("Order", orderSchema);
exports.default = Order;
