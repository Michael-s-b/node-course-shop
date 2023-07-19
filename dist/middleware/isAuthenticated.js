"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated) {
        return res.redirect("/login");
    }
    next();
};
exports.default = isAuthenticated;
