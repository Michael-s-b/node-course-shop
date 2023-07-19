import { body } from "express-validator";
import { User } from "../models";

const customEmailValidation = () => {
	return body("email").trim().normalizeEmail().isEmail().withMessage("Please enter a valid email");
};

const customPasswordValidation = () => {
	return body("password").trim().isLength({ min: 5 }).withMessage("Password must be at least 5 characters long");
};

const signupValidation = () => {
	return [
		customEmailValidation(),
		customPasswordValidation(),
		body("confirmPassword")
			.trim()
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error("Passwords do not match");
				}
				return true;
			}),
		body("email").custom(async (value, { req }) => {
			const userFound = await User.findOne({ email: req.body.email });
			if (userFound) {
				throw new Error("Email already registered");
			}
		}),
	];
};

const loginValidation = () => {
	return [customEmailValidation(), customPasswordValidation()];
};

const titleValidator = () => {
	return body("title")
		.trim()
		.isLength({ min: 3 })
		.withMessage("Title must be at least 3 characters long")
		.isString()
		.withMessage("Please use only alphanumeric characters");
};
// const imageURLValidator = () => {
// 	return body("image").trim().isString().withMessage("Invalid image URL");
// };

const priceValidator = () => {
	return body("price").trim().isFloat().withMessage("Price must be a float");
};

const descriptionValidator = () => {
	return body("description")
		.trim()
		.isLength({ min: 10 })
		.withMessage("Description must be at least 10 characters long");
	// .isAlphanumeric()
	// .withMessage("Description must contain only alphanumeric characters");
};
const productValidator = () => {
	return [titleValidator(), priceValidator(), descriptionValidator()];
};

export default { signupValidation, loginValidation, productValidator };
