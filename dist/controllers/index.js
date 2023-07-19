"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.errorController = exports.shopController = exports.adminController = void 0;
var adminController_1 = require("./adminController");
Object.defineProperty(exports, "adminController", { enumerable: true, get: function () { return __importDefault(adminController_1).default; } });
var shopController_1 = require("./shopController");
Object.defineProperty(exports, "shopController", { enumerable: true, get: function () { return __importDefault(shopController_1).default; } });
var errorController_1 = require("./errorController");
Object.defineProperty(exports, "errorController", { enumerable: true, get: function () { return __importDefault(errorController_1).default; } });
var authController_1 = require("./authController");
Object.defineProperty(exports, "authController", { enumerable: true, get: function () { return __importDefault(authController_1).default; } });
