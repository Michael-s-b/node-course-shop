import { Document, Model, ObjectId, Schema, Types, model } from "mongoose";
import Product from "./product";
import Order, { IOrder, IOrderMethods } from "./order";
interface UserWithPopulatedCartItems {
	cart: {
		items: {
			productId: InstanceType<typeof Product>;
			quantity: number;
		}[];
	};
}
interface Cart {
	items: {
		productId: Types.ObjectId;
		quantity: number;
	}[];
}

interface IUser {
	password: string;
	email: string;
	cart: Cart;
	resetToken?: string;
	resetTokenExpiration?: Date;
	createdAt: Date;
	updatedAt: Date;
}

interface IUserMethods extends Document {
	addToCart(
		this: InstanceType<typeof User>,
		product: InstanceType<typeof Product>
	): Promise<Document<unknown, {}, IUser> & Omit<IUser & { _id: Types.ObjectId }, never>>;
	removeFromCart(
		this: InstanceType<typeof User>,
		productId: string | ObjectId
	): Promise<
		Document<unknown, {}, IUser> &
			Omit<
				IUser & {
					_id: Types.ObjectId;
				},
				keyof IUserMethods
			> &
			IUserMethods
	>;
	addOrder(this: InstanceType<typeof User>): Promise<
		Document<unknown, {}, IOrder> &
			Omit<
				IOrder & {
					_id: Types.ObjectId;
				},
				keyof IOrderMethods
			> &
			IOrderMethods
	>;
	getOrders(this: InstanceType<typeof User>): Promise<
		(Document<unknown, {}, IOrder> &
			Omit<
				IOrder & {
					_id: Types.ObjectId;
				},
				keyof IOrderMethods
			> &
			IOrderMethods)[]
	>;
}

interface IUserModel extends Model<IUser, {}, IUserMethods> {}

const userSchema = new Schema<IUser, IUserModel, IUserMethods>(
	{
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
						productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
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
	},
	{ timestamps: true }
);

userSchema.method(
	"addToCart",
	async function (
		this: Document<unknown, {}, IUser> & Omit<IUser & { _id: Types.ObjectId }, keyof IUserMethods> & IUserMethods,
		product: InstanceType<typeof Product>
	) {
		try {
			let newQuantity = 1;
			let updatedCartItems;
			if (this.cart) {
				const cartProductIndex = this.cart.items.findIndex(
					(cartProduct: { productId: { toString: () => string } }) => {
						return cartProduct.productId.toString() === product._id.toString(); // check if the cart already has the product
					}
				);
				updatedCartItems = [...this.cart.items];
				if (cartProductIndex >= 0) {
					newQuantity = this.cart.items[cartProductIndex].quantity + 1;
					updatedCartItems[cartProductIndex].quantity = newQuantity;
				} else {
					updatedCartItems.push({ productId: product._id, quantity: newQuantity });
				}
			} else {
				const newCart = { items: [{ productId: product._id, quantity: newQuantity }] };
				this.cart = newCart;
				return await this.save();
			}
			const updatedCart = { items: updatedCartItems };
			this.cart = updatedCart;
			return await this.save();
		} catch (error) {
			throw error;
		}
	}
);

userSchema.method("removeFromCart", async function (this: InstanceType<typeof User>, productId: string | ObjectId) {
	try {
		const updatedCartItems = this.cart.items.filter((item) => {
			return item.productId.toString() !== productId.toString();
		});
		this.cart.items = updatedCartItems;
		return this.save();
	} catch (error) {
		throw error;
	}
});

userSchema.method("addOrder", async function (this: InstanceType<typeof User>) {
	const user = await this.populate<UserWithPopulatedCartItems>("cart.items.productId"); //user with populated cart items
	let totalPrice: number = 0;
	user.cart.items.forEach((item) => {
		totalPrice += item.productId.price * item.quantity;
	});
	console.log(user.cart.items);
	const orderItems = user.cart.items.map((item) => {
		return { product: item.productId, quantity: item.quantity };
	});
	const newOrder = new Order({ user: { name: this.email, userId: this }, items: orderItems, totalPrice });
	this.cart = { items: [] };
	this.save();
	return await newOrder.save();
});

userSchema.method("getOrders", async function (this: InstanceType<typeof User>) {
	return await Order.find({ "user.userId": this._id });
});

const User = model<IUser, IUserModel>("User", userSchema);
export default User;
