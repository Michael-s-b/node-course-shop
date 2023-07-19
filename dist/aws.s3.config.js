"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromS3 = exports.downloadFromS3 = exports.uploadToS3 = exports.s3 = void 0;
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const fs_1 = __importDefault(require("fs"));
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
exports.s3 = new s3_1.default({
    region: AWS_BUCKET_REGION,
    credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY },
});
const uploadToS3 = async (file) => {
    const fileStream = fs_1.default.createReadStream(file.path);
    return exports.s3.upload({ Bucket: AWS_BUCKET_NAME, Key: file.filename, Body: fileStream }).promise();
};
exports.uploadToS3 = uploadToS3;
const downloadFromS3 = (key) => {
    const downloadParams = {
        Key: key,
        Bucket: process.env.AWS_BUCKET_NAME,
    };
    return exports.s3.getObject(downloadParams).createReadStream();
};
exports.downloadFromS3 = downloadFromS3;
const deleteFromS3 = async (key) => {
    const result = await exports.s3.deleteObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }).promise();
    return result;
};
exports.deleteFromS3 = deleteFromS3;
