"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const path_2 = __importDefault(require("./utils/path"));
const routes_1 = require("./routes");
const controllers_1 = require("./controllers");
const models_1 = require("./models");
const mongoose_1 = __importDefault(require("mongoose"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongodb_session_1 = __importDefault(require("connect-mongodb-session"));
const multer_1 = __importDefault(require("multer"));
// import { doubleCsrf } from "csrf-csrf";
// import cookieParser from "cookie-parser";
const csurf_1 = __importDefault(require("csurf"));
const connect_flash_1 = __importDefault(require("connect-flash"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const fs_1 = __importDefault(require("fs"));
console.log(process.env.NODE_ENV);
const MongoDBStoreSession = (0, connect_mongodb_session_1.default)(express_session_1.default);
// const { doubleCsrfProtection, generateToken } = doubleCsrf({
// 	getSecret: () => {
// 		return "csrf-secret";
// 	},
// });
//config server
const app = (0, express_1.default)();
const csrfProtection = (0, csurf_1.default)();
const accessLogStream = fs_1.default.createWriteStream(path_1.default.join(__dirname, "access.log"), { flags: "a" });
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            "script-src": ["'self'", "https://js.stripe.com/v3/ 'unsafe-inline' "],
            "default-src": ["'self'", "https://js.stripe.com/v3/"],
        },
    },
})); //helmet configuration
//ssl configuration
// const privatKey = fs.readFileSync(path.join(__dirname, "../server.key"));
// const certificate = fs.readFileSync(path.join(__dirname, "../server.cert"));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("combined", { stream: accessLogStream }));
app.use(express_1.default.json(), express_1.default.urlencoded({ extended: true })); //parse request body
const fileStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname + "-" + Date.now() + path_1.default.extname(file.originalname));
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
app.use((0, multer_1.default)({ dest: "images", storage: fileStorage, fileFilter: fileFilter }).single("image")); //parse request body with multer
app.use(express_1.default.static(path_1.default.join(path_2.default, "public"))); //setup public static directory
app.use("/images", express_1.default.static(path_1.default.join(path_2.default, "../images"))); //setup public static directory
app.set("view engine", "ejs"); //set the express app template engine
app.set("views", path_1.default.join(path_2.default, "views")); //set where the templates for the template engine are located
//configure express sessions
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoDBStoreSession({
        uri: process.env.MONGODB_URI,
        collection: "sessions",
    }),
}));
//setup flash
app.use((0, connect_flash_1.default)());
//setup csrf protection
app.use(csrfProtection);
// app.use(doubleCsrfProtection);
//extract the user from the session data and set if is authenticated
app.use(async (req, res, next) => {
    try {
        if (!req.session.userId) {
            req.isAuthenticated = false;
            return next();
        }
        req.user = await models_1.User.findOne({ _id: req.session.userId });
        if (!req.user) {
            req.isAuthenticated = false;
            return next();
        }
        else {
            req.isAuthenticated = true;
            return next();
        }
    }
    catch (err) {
        return next(new Error(err));
    }
}); // session authentication
//setup locals for the views
app.use((req, res, next) => {
    try {
        res.locals.isAuthenticated = req.isAuthenticated;
        res.locals.csrfToken = req.csrfToken();
        return next();
    }
    catch (err) {
        return next(new Error(err));
    }
});
//setup routes
app.use("/", routes_1.shopRouter);
app.use("/", routes_1.authRouter);
app.use("/admin", routes_1.adminRouter);
app.use(routes_1.errorRouter);
app.use("/", controllers_1.errorController.get404);
//Error handler middleware
app.use((err, req, res, next) => {
    if (err.statusCode === 403) {
        console.log(err.message);
        return res.status(403).redirect("/403");
    }
    if (err.statusCode === 404) {
        console.log(err.message);
        return res.status(404).redirect("/404");
    }
    console.log(err);
    return res.status(500).redirect("/500");
});
//start server
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => {
    console.log("connected to DB");
    app.listen(process.env.PORT, () => {
        console.log(`Listening on ${process.env.PORT}`);
    });
    // https.createServer({ key: privatKey, cert: certificate }, app).listen(process.env.PORT, () => {
    // 	console.log(`Listening on ${process.env.PORT}`);
    // });
})
    .catch((err) => {
    console.log(err);
});
