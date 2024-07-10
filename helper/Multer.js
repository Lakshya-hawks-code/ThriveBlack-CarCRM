import fs from "fs";

export const uploadProfile = async (path, file) => {
  if (!file) {
    throw new Error('File is undefined or null.');
  }

  let uploadpath = `public${path}`;

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(uploadpath)) {
      fs.mkdirSync(uploadpath);
    }
    const matches = file.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      reject(new Error('Invalid base64 data'));
      return;
    }

    const extensionMatches = matches[1].match(/(?:jpeg|jpg|png|gif)/);
    const extension = extensionMatches ? extensionMatches[0] : 'png'; // Default to 'png' if no valid extension found
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const namefile = new Date().getTime() + `.${extension}`;
    const filePath = uploadpath + namefile;
    const Image = path + namefile;

    fs.writeFile(filePath, buffer, 'base64', function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(Image);
      }
    });
  });
};
