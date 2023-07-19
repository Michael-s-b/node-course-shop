import { Schema, Types, model } from "mongoose";
// 1. Create an interface representing a document in MongoDB.
interface IProduct {
	title: string;
	price: number;
	description: string;
	imageUrl: string;
	createdAt: Date;
	updatedAt: Date;
	userId: Types.ObjectId;
}
// 2. Create a Schema corresponding to the document interface.
export const productSchema = new Schema<IProduct>(
	{
		title: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		imageUrl: {
			type: String,
			required: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{ timestamps: true }
);
// 3. Create a Model.
const Product = model<IProduct>("Product", productSchema);

export default Product;

// import { ObjectId } from "mongodb";
// import { getDb } from "../utils/database";

// class Product {
// 	_id!: ObjectId;
// 	title: string;
// 	price: number;
// 	description: string;
// 	imageURL: string;
// 	userId: ObjectId;
// 	constructor(title: string, price: number, description: string, imageURL: string, userId: ObjectId) {
// 		this.title = title;
// 		this.price = price;
// 		this.description = description;
// 		this.imageURL = imageURL;
// 		this.userId = userId;
// 	}
// 	async save() {
// 		try {
// 			const db = getDb();
// 			return await db.collection<Product>("products").insertOne(this);
// 		} catch (error) {
// 			throw error;
// 		}
// 	}
// 	static async updateById(
// 		id: ObjectId,
// 		update: { title?: string; description?: string; imageURL?: string; price?: number }
// 	) {
// 		try {
// 			const db = getDb();
// 			return await db.collection<Product>("products").findOneAndUpdate({ _id: id }, { $set: update });
// 		} catch (error) {
// 			throw error;
// 		}
// 	}
// 	static async fetchAll() {
// 		try {
// 			const db = getDb();
// 			return await db.collection<Product>("products").find().toArray();
// 		} catch (error) {
// 			throw error;
// 		}
// 	}
// 	static async findById(id: ObjectId) {
// 		const db = getDb();
// 		try {
// 			return db.collection<Product>("products").findOne({ _id: id });
// 		} catch (error) {
// 			throw error;
// 		}
// 	}
// 	static async deleteById(id: ObjectId) {
// 		try {
// 			const db = getDb();
// 			return await db.collection<Product>("products").deleteOne({ _id: id });
// 		} catch (error) {
// 			throw error;
// 		}
// 	}
// }
