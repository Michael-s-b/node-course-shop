import { Document, Model, Schema, Types, model } from "mongoose";
import Product, { productSchema } from "./product";

export interface IOrder {
	user: { name: string; userId: Types.ObjectId };
	items: {
		product: InstanceType<typeof Product>;
		quantity: number;
	}[];
	totalPrice: number;
}

export interface IOrderMethods extends Document {}

export interface IOrderModel extends Model<IOrder, {}, IOrderMethods> {}

const orderSchema = new Schema<IOrder, IOrderModel, IOrderMethods>({
	user: {
		name: { type: String, required: true },
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
	},
	items: [
		{
			product: { type: productSchema, required: true },
			quantity: { type: Number, required: true },
		},
	],
	totalPrice: { type: Number, required: true },
});

// orderSchema.method("addOrder", async function (this: InstanceType<typeof Order>) {});

const Order = model<IOrder, IOrderModel>("Order", orderSchema);
export default Order;
