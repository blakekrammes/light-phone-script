import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const addOrdinalSuffix = (n: number): string => {
  let j = n % 10,
    k = n % 100;
  if (j === 1 && k !== 11) {
    return n + 'st';
  }
  if (j === 2 && k !== 12) {
    return n + 'nd';
  }
  if (j === 3 && k !== 13) {
    return n + 'rd';
  }
  return n + 'th';
};

export const request = async (url: string) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });
    return response;
  } catch (error) {
    console.error(`Error fetching ${url}: `, error);
    throw error;
  }
};

export const downloadFile = async (url: string, destinationPath: string) => {
  const saveFile = await request(url);
  const basename = path.basename(url);
  const fileName = basename.slice(0, basename.indexOf('?'));
  const filePath = path.join(destinationPath, fileName);

  const fileStream = fs.createWriteStream(filePath);
  saveFile.data.pipe(fileStream);

  return new Promise((resolve, reject) => {
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
};

export const deleteAllFilesInDirectory = (dirPath: string) => {
  try {
    // Read the contents of the directory
    const files = fs.readdirSync(dirPath);

    // Iterate over each file
    for (const file of files) {
      const filePath = `${dirPath}/${file}`;

      // Check if the current item is a file
      if (fs.lstatSync(filePath).isFile()) {
        // Delete the file
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error deleting files in directory: ${error.message}`);
    } else {
      console.error(error);
    }
  }
};
