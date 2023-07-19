"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorRouter = exports.authRouter = exports.shopRouter = exports.adminRouter = void 0;
var adminRouter_1 = require("./adminRouter");
Object.defineProperty(exports, "adminRouter", { enumerable: true, get: function () { return __importDefault(adminRouter_1).default; } });
var shopRouter_1 = require("./shopRouter");
Object.defineProperty(exports, "shopRouter", { enumerable: true, get: function () { return __importDefault(shopRouter_1).default; } });
var authRouter_1 = require("./authRouter");
Object.defineProperty(exports, "authRouter", { enumerable: true, get: function () { return __importDefault(authRouter_1).default; } });
var errorRouter_1 = require("./errorRouter");
Object.defineProperty(exports, "errorRouter", { enumerable: true, get: function () { return __importDefault(errorRouter_1).default; } });
