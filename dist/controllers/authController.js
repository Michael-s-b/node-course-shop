"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const crypto_1 = __importDefault(require("crypto"));
const express_validator_1 = require("express-validator");
mail_1.default.setApiKey(process.env.EMAIL_SECRET_KEY);
const renderLogin = (req, res, next) => {
    try {
        let isMessage = req.flash("error");
        let flashMessage;
        if (isMessage.length > 0) {
            flashMessage = isMessage[0];
        }
        else {
            flashMessage = null;
        }
        res.render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: flashMessage,
            oldInput: undefined,
            validationErrors: [],
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const logIn = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const userFound = await models_1.User.findOne({ email });
        if (!userFound) {
            return res.status(422).render("auth/login", {
                path: "/login",
                pageTitle: "Login",
                errorMessage: "Invalid email",
                oldInput: { email: email, password: password },
                validationErrors: [{ param: "email" }],
            });
        }
        if (await bcryptjs_1.default.compare(password, userFound.password)) {
            req.session.userId = userFound._id;
            return req.session.save(() => {
                return res.redirect("/");
            });
        }
        else {
            req.flash("error", "Invalid password");
            return res.status(422).render("auth/login", {
                path: "/login",
                pageTitle: "Login",
                errorMessage: "Invalid password",
                oldInput: { email: email, password: password },
                validationErrors: [{ param: "password" }],
            });
        }
    }
    catch (err) {
        return next(new Error(err));
    }
};
const logOut = async (req, res, next) => {
    try {
        req.session.destroy((err) => {
            res.redirect("/");
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const renderSignup = async (req, res, next) => {
    try {
        let isMessage = req.flash("error");
        let flashMessage;
        if (isMessage.length > 0) {
            flashMessage = isMessage[0];
        }
        else {
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
    }
    catch (err) {
        return next(new Error(err));
    }
};
const signup = async (req, res, next) => {
    try {
        const { email, password, confirmPassword } = req.body;
        const errors = (0, express_validator_1.validationResult)(req);
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = new models_1.User({ email, password: hashedPassword });
        await user.save();
        mail_1.default.send({
            to: email,
            from: "michelsilva098@gmail.com",
            subject: "Sending with SendGrid is Fun",
            text: "and easy to do anywhere, even with Node.js",
            html: "<strong>and easy to do anywhere, even with Node.js</strong>",
        });
        return res.redirect("/login");
    }
    catch (err) {
        return next(new Error(err));
    }
};
const renderReset = async (req, res, next) => {
    try {
        let isMessage = req.flash("error");
        let flashMessage;
        if (isMessage.length > 0) {
            flashMessage = isMessage[0];
        }
        else {
            flashMessage = null;
        }
        res.render("auth/reset", {
            path: "/reset",
            pageTitle: "Reset Password",
            isAuthenticated: false,
            errorMessage: flashMessage,
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const generateResetPasswordToken = async (req, res, next) => {
    const { email } = req.body;
    try {
        const userFound = await models_1.User.findOne({ email: email });
        crypto_1.default.randomBytes(32, (err, buffer) => {
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
            userFound.resetTokenExpiration = (Date.now() + 360_000_0);
            userFound.save();
            mail_1.default.send({
                to: email,
                from: "//",
                subject: `Token:${token}`,
                text: "and easy to do anywhere, even with Node.js",
                html: `
			<p>You requested a password reset</p>
			<p>Click this <a href="http://localhost:3000/reset/${token}"/> to set a new password</p>`,
            });
            res.redirect("/");
        });
    }
    catch (err) {
        return next(new Error(err));
    }
};
const renderNewPassword = async (req, res, next) => {
    const resetToken = req.params.resetToken;
    try {
        const userFound = await models_1.User.findOne({ resetToken: resetToken, resetTokenExpiration: { $gt: Date.now() } });
        if (!userFound) {
            console.log("user not found or token expired");
            return res.redirect("/");
        }
        let isMessage = req.flash("error");
        let flashMessage;
        if (isMessage.length > 0) {
            flashMessage = isMessage[0];
        }
        else {
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
    }
    catch (err) {
        return next(new Error(err));
    }
};
const updatePassword = async (req, res, next) => {
    const { password, userId, resetToken } = req.body;
    try {
        const userFound = await models_1.User.findOne({
            _id: userId,
            resetToken: resetToken,
            resetTokenExpiration: { $gt: Date.now() },
        });
        if (!userFound) {
            return res.redirect("/");
        }
        //console.log(password);
        const hashedNewPassword = await bcryptjs_1.default.hash(password, 12);
        userFound.password = hashedNewPassword;
        userFound.resetToken = undefined;
        userFound.resetTokenExpiration = undefined;
        await userFound.save();
        res.redirect("/login");
    }
    catch (err) {
        return next(new Error(err));
    }
};
exports.default = {
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
