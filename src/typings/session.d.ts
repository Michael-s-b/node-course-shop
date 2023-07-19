import { SessionData } from "express-session";
import { ObjectId } from "mongoose";

declare module "express-session" {
	interface SessionData {
		isLoggedIn: string | boolean;
		userId: ObjectId;
	}
}
