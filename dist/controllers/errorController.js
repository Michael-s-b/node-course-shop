"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get404 = (req, res, next) => {
    res.status(404).render("404", {
        pageTitle: "Resource Not Found",
        path: "/404",
    });
};
const get500 = (req, res, next) => {
    res.status(500).render("500", {
        pageTitle: "Server Error",
        path: "/500",
    });
};
const get403 = (req, res, next) => {
    res.status(403).render("403", {
        pageTitle: "Forbidden Access",
        path: "/403",
    });
};
exports.default = { get404, get500, get403 };
