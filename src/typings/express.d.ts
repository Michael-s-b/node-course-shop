import { User } from "../models";
import mongoose from "mongoose";
declare global {
	namespace Express {
		interface Request {
			user: InstanceType<typeof User> | null;
			isAuthenticated: boolean | undefined;
		}
	}
}
