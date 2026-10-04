import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform } from 'react-native';

const DATA_URI_PREFIX = {
  csv: 'data:text/csv;charset=utf-8;base64,',
  pdf: 'data:application/pdf;base64,',
};

/**
 * Write a base64 data URI to disk and return a file:// path.
 */
const writeDataUriToFile = async (dataUri, fileName, format) => {
  const prefix = DATA_URI_PREFIX[format];
  if (!prefix || !dataUri.startsWith(prefix)) {
    throw new Error('Invalid data URI for format: ' + format);
  }

  const base64 = dataUri.substring(prefix.length);
  const dirPath =
    Platform.OS === 'android'
      ? RNFS.CachesDirectoryPath
      : RNFS.TemporaryDirectoryPath;

  const filePath = `${dirPath}/${fileName}`;
  await RNFS.writeFile(filePath, base64, 'base64');
  return `file://${filePath}`;
};

/**
 * Share a report file (PDF or CSV) via the native share sheet.
 */
export const shareReportFile = async (dataUri, fileName, format) => {
  const fileUrl = await writeDataUriToFile(dataUri, fileName, format);
  const mimeType = format === 'csv' ? 'text/csv' : 'application/pdf';

  await Share.open({
    url: fileUrl,
    type: mimeType,
    filename: fileName.replace(/\.[^.]+$/, ''), // filename without extension
    title: `Share ${fileName}`,
    failOnCancel: false,
    saveToFiles: true, // iOS: expose "Save to Files"
  });
};