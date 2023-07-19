import { NextFunction, Request, Response } from "express";

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
	if (!req.isAuthenticated) {
		return res.redirect("/login");
	}
	next();
};
export default isAuthenticated;
