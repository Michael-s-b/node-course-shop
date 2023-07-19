import S3 from "aws-sdk/clients/s3";
import fs from "fs";
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION as string;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY as string;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY as string;
export const s3 = new S3({
	region: AWS_BUCKET_REGION,
	credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY },
});

export const uploadToS3 = async (file: Express.Multer.File) => {
	const fileStream = fs.createReadStream(file.path);
	return s3.upload({ Bucket: AWS_BUCKET_NAME, Key: file.filename, Body: fileStream }).promise();
};
export const downloadFromS3 = (key: string) => {
	const downloadParams = {
		Key: key,
		Bucket: process.env.AWS_BUCKET_NAME as string,
	};
	return s3.getObject(downloadParams).createReadStream();
};
export const deleteFromS3 = async (key: string) => {
	const result = await s3.deleteObject({ Bucket: process.env.AWS_BUCKET_NAME as string, Key: key }).promise();
	return result;
};
