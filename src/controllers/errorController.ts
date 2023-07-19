import { NextFunction, Request, Response } from "express";

const get404 = (req: Request, res: Response, next: NextFunction) => {
	res.status(404).render("404", {
		pageTitle: "Resource Not Found",
		path: "/404",
	});
};

const get500 = (req: Request, res: Response, next: NextFunction) => {
	res.status(500).render("500", {
		pageTitle: "Server Error",
		path: "/500",
	});
};

const get403 = (req: Request, res: Response, next: NextFunction) => {
	res.status(403).render("403", {
		pageTitle: "Forbidden Access",
		path: "/403",
	});
};

export default { get404, get500, get403 };
