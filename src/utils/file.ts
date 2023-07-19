import fs from "fs";
const deleteFile = (filePath: string) => {
	fs.unlink(filePath, (err) => {
		if (err) throw err;
	});
};
export default { deleteFile };
