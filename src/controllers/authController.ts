import { NextFunction, Request, Response } from "express";
import { User } from "../models";
import bcrypt from "bcryptjs";
import sgMail from "@sendgrid/mail";
import _ from "lodash";
import crypto from "crypto";
import { validationResult } from "express-validator";
sgMail.setApiKey(process.env.EMAIL_SECRET_KEY as string);

const renderLogin = (req: Request, res: Response, next: NextFunction) => {
	try {
		let isMessage = req.flash("error");
		let flashMessage;
		if (isMessage.length > 0) {
			flashMessage = isMessage[0];
		} else {
			flashMessage = null;
		}
		res.render("auth/login", {
			path: "/login",
			pageTitle: "Login",
			errorMessage: flashMessage,
			oldInput: undefined,
			validationErrors: [],
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const logIn = async (req: Request, res: Response, next: NextFunction) => {
	const { email, password } = req.body;
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors.array());
			return res.status(422).render("auth/login", {
				path: "/login",
				pageTitle: "Login",
				errorMessage: errors.array()[0].msg,
				oldInput: { email: email, password: password },
				validationErrors: errors.array(),
			});
		}
		const userFound = await User.findOne({ email });
		if (!userFound) {
			return res.status(422).render("auth/login", {
				path: "/login",
				pageTitle: "Login",
				errorMessage: "Invalid email",
				oldInput: { email: email, password: password },
				validationErrors: [{ param: "email" }],
			});
		}
		if (await bcrypt.compare(password, userFound.password)) {
			req.session.userId = userFound._id;
			return req.session.save(() => {
				return res.redirect("/");
			});
		} else {
			req.flash("error", "Invalid password");
			return res.status(422).render("auth/login", {
				path: "/login",
				pageTitle: "Login",
				errorMessage: "Invalid password",
				oldInput: { email: email, password: password },
				validationErrors: [{ param: "password" }],
			});
		}
	} catch (err) {
		return next(new Error(err as any));
	}
};

const logOut = async (req: Request, res: Response, next: NextFunction) => {
	try {
		req.session.destroy((err) => {
			res.redirect("/");
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const renderSignup = async (req: Request, res: Response, next: NextFunction) => {
	try {
		let isMessage = req.flash("error");
		let flashMessage;
		if (isMessage.length > 0) {
			flashMessage = isMessage[0];
		} else {
			flashMessage = null;
		}
		res.render("auth/signup", {
			path: "/signup",
			pageTitle: "Signup",
			isAuthenticated: false,
			errorMessage: flashMessage,
			oldInput: undefined,
			validationErrors: [],
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const signup = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { email, password, confirmPassword } = req.body;
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors.array());
			return res.status(422).render("auth/signup", {
				path: "/signup",
				pageTitle: "Signup",
				errorMessage: errors.array()[0].msg,
				oldInput: { email: email, password: password, confirmPassword: confirmPassword },
				validationErrors: errors.array(),
			});
		}
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({ email, password: hashedPassword });
		await user.save();
		sgMail.send({
			to: email, // Change to your recipient
			from: "michelsilva098@gmail.com", // Change to your verified sender
			subject: "Sending with SendGrid is Fun",
			text: "and easy to do anywhere, even with Node.js",
			html: "<strong>and easy to do anywhere, even with Node.js</strong>",
		});
		return res.redirect("/login");
	} catch (err) {
		return next(new Error(err as any));
	}
};

const renderReset = async (req: Request, res: Response, next: NextFunction) => {
	try {
		let isMessage = req.flash("error");
		let flashMessage;
		if (isMessage.length > 0) {
			flashMessage = isMessage[0];
		} else {
			flashMessage = null;
		}
		res.render("auth/reset", {
			path: "/reset",
			pageTitle: "Reset Password",
			isAuthenticated: false,
			errorMessage: flashMessage,
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const generateResetPasswordToken = async (req: Request, res: Response, next: NextFunction) => {
	const { email } = req.body;
	try {
		const userFound = await User.findOne({ email: email });
		crypto.randomBytes(32, (err, buffer) => {
			if (err) {
				console.log(err);
				return res.redirect("/reset");
			}
			const token = buffer.toString("hex");
			if (!userFound) {
				req.flash("error", "No account with that email found");
				return res.redirect("/reset");
			}
			userFound.resetToken = token;
			userFound.resetTokenExpiration = (Date.now() + 360_000_0) as unknown as Date;
			userFound.save();
			sgMail.send({
				to: email, // Change to your recipient
				from: "//", // Change to your verified sender
				subject: `Token:${token}`,
				text: "and easy to do anywhere, even with Node.js",
				html: `
			<p>You requested a password reset</p>
			<p>Click this <a href="http://localhost:3000/reset/${token}"/> to set a new password</p>`,
			});
			res.redirect("/");
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const renderNewPassword = async (req: Request, res: Response, next: NextFunction) => {
	const resetToken = req.params.resetToken;
	try {
		const userFound = await User.findOne({ resetToken: resetToken, resetTokenExpiration: { $gt: Date.now() } });
		if (!userFound) {
			console.log("user not found or token expired");
			return res.redirect("/");
		}
		let isMessage = req.flash("error");
		let flashMessage;
		if (isMessage.length > 0) {
			flashMessage = isMessage[0];
		} else {
			flashMessage = null;
		}
		res.render("auth/new-password", {
			path: "/new-password",
			pageTitle: "New Password",
			isAuthenticated: false,
			errorMessage: flashMessage,
			userId: userFound.id,
			resetToken,
		});
	} catch (err) {
		return next(new Error(err as any));
	}
};

const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
	const { password, userId, resetToken } = req.body;
	try {
		const userFound = await User.findOne({
			_id: userId,
			resetToken: resetToken,
			resetTokenExpiration: { $gt: Date.now() },
		});
		if (!userFound) {
			return res.redirect("/");
		}
		//console.log(password);

		const hashedNewPassword = await bcrypt.hash(password, 12);
		userFound.password = hashedNewPassword;
		userFound.resetToken = undefined;
		userFound.resetTokenExpiration = undefined;
		await userFound.save();
		res.redirect("/login");
	} catch (err) {
		return next(new Error(err as any));
	}
};

export default {
	renderLogin,
	logIn,
	logOut,
	renderSignup,
	signup,
	renderReset,
	generateResetPasswordToken,
	renderNewPassword,
	updatePassword,
};
