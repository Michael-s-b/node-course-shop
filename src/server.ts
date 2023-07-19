import dotenv from "dotenv";
dotenv.config();
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import rootDir from "./utils/path";
import { shopRouter, adminRouter, authRouter, errorRouter } from "./routes";
import { errorController } from "./controllers";
import { User } from "./models";
import mongoose from "mongoose";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import multer from "multer";
// import { doubleCsrf } from "csrf-csrf";
// import cookieParser from "cookie-parser";
import csrf from "csurf";
import flash from "connect-flash";
import { HttpError } from "http-errors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

console.log(process.env.NODE_ENV);

const MongoDBStoreSession = MongoDBStore(session);

// const { doubleCsrfProtection, generateToken } = doubleCsrf({
// 	getSecret: () => {
// 		return "csrf-secret";
// 	},
// });

//config server
const app = express();
const csrfProtection = csrf();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				"script-src": ["'self'", "https://js.stripe.com/v3/ 'unsafe-inline' "],
				"default-src": ["'self'", "https://js.stripe.com/v3/"],
				"script-src-attr": ["'self' 'unsafe-inline'"],
			},
		},
	})
); //helmet configuration
//ssl configuration
// const privatKey = fs.readFileSync(path.join(__dirname, "../server.key"));
// const certificate = fs.readFileSync(path.join(__dirname, "../server.cert"));

app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(express.json(), express.urlencoded({ extended: true })); //parse request body

const fileStorage = multer.diskStorage({
	filename: (req, file, cb) => {
		cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
	},
});
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
		cb(null, true);
	} else {
		cb(null, false);
	}
};
app.use(multer({ dest: "images", storage: fileStorage, fileFilter: fileFilter }).single("image")); //parse request body with multer

app.use(express.static(path.join(rootDir, "public"))); //setup public static directory

app.set("view engine", "ejs"); //set the express app template engine

app.set("views", path.join(rootDir, "views")); //set where the templates for the template engine are located

//configure express sessions

app.use(
	session({
		secret: process.env.SESSION_SECRET as string,
		resave: false,
		saveUninitialized: false,
		store: new MongoDBStoreSession({
			uri: process.env.MONGODB_URI as string,
			collection: "sessions",
		}),
	})
);

//setup flash
app.use(flash());

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
		req.user = await User.findOne({ _id: req.session.userId });
		if (!req.user) {
			req.isAuthenticated = false;
			return next();
		} else {
			req.isAuthenticated = true;
			return next();
		}
	} catch (err) {
		return next(new Error(err as any));
	}
}); // session authentication

//setup locals for the views
app.use((req, res, next) => {
	try {
		res.locals.isAuthenticated = req.isAuthenticated;
		res.locals.csrfToken = req.csrfToken();
		return next();
	} catch (err) {
		return next(new Error(err as any));
	}
});

//setup routes

app.use("/", shopRouter);

app.use("/", authRouter);

app.use("/admin", adminRouter);

app.use(errorRouter);

app.use("/", errorController.get404);

//Error handler middleware
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
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
mongoose
	.connect(process.env.MONGODB_URI as string)
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
