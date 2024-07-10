import twilio from 'twilio';
import { Get_API_KEY } from '../helper/GetApiKey.js';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import mongoose from 'mongoose';
import moment from 'moment';

function getCurrentDateTime() {
  const currentDate = moment();
  return currentDate.format('YYYYMMDDHHmmss');
}

export const SendMessage = async (req, res) => {
  try {
    let mobileNumbers = req.body.mobileNumbers;
    let message = req.body.message;

    if (typeof mobileNumbers === 'string') {
      mobileNumbers = [mobileNumbers];
    } else if (!Array.isArray(mobileNumbers)) {
      throw new Error('Mobile numbers must be an array or a single string');
    }

    if (!mobileNumbers.length) {
      throw new Error('Mobile numbers are missing');
    }

    await Get_API_KEY();

    // Create a Twilio client
    const accountSid = global.TwilioAccountSid;
    const authToken = global.TwilioAuthToken;
    const client = twilio(accountSid, authToken);

    for (let mobileNumber of mobileNumbers) {
      try {
        await client.messages.create({
          body: message,
          to: mobileNumber,
          from: '+18632266171',
        });
      } catch (smsError) {
        console.error(`Failed to send SMS to : ${smsError.message}`);
      }
    }

    res.json({ status: 200, message: 'SMS sent successfully' });
  } catch (error) {
    console.error(`Failed to Send Message: ${error.message}`);
    res.json({ status: 400, message: error.message });
  }
};

export const ExportDB = async (req, res) => {
  try {
    const zipFilePath = await exportDatabaseBackup();

    const formattedFilePath = `/${path.relative(path.join(process.cwd(), "public"), zipFilePath)}`;

    res.json({ status: 200, data: { filePath: formattedFilePath } });
  } catch (error) {
    console.error(`Failed to Export Database backup: ${error.message}`);
    res.status(500).json({ status: 500, message: "Failed to Export Database backup" });
  }
};

async function exportDatabaseBackup() {
  try {
    const dbName = global.DBNAME;
    const db = mongoose.connection.getClient().db(dbName);

    const collections = await db.listCollections().toArray();

    const archive = archiver("zip", { zlib: { level: 9 } });
    const backupDir = path.join(process.cwd(), "public", "Backup");
    await fs.ensureDir(backupDir);
    const dateTime = getCurrentDateTime();
    const zipFileName = `DB_backup_${dateTime}.zip`;
    const zipFilePath = path.join(backupDir, zipFileName);
    const outputZipStream = fs.createWriteStream(zipFilePath);
    archive.pipe(outputZipStream);

    for (const collection of collections) { 
      const data = await db.collection(collection.name).find().toArray();
  
      const extendedData = data.map(doc => {
        const transformedDoc = { ...doc };

        if (transformedDoc._id && transformedDoc._id instanceof mongoose.Types.ObjectId) {
          transformedDoc._id = { $oid: transformedDoc._id.toString() };
        }

        ["createdAt", "updatedAt", "driver_assign_date", "transaction_date"].forEach(field => {
          if (transformedDoc[field] && transformedDoc[field] instanceof Date) {
            transformedDoc[field] = { $date: transformedDoc[field].toISOString() };
          }
        }); 

        return transformedDoc;
      });

      archive.append(JSON.stringify(extendedData, null, 2), {
        name: `${collection.name}.json`,
      });
    }

    await archive.finalize();
    outputZipStream.end();

    return zipFilePath;
  } catch (error) {
    console.error("Error exporting database backup: ", error);
    throw error;
  }
}




