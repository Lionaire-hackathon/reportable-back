import { File } from 'src/file/entity/file.entity';

export function classifyFiles(files: File[]): { imageFiles: File[], spreadsheetFiles: File[] } {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const spreadsheetExtensions = ['.xlsx', '.xls', '.csv'];

  const imageFiles: File[] = [];
  const spreadsheetFiles: File[] = [];

  files.forEach(file => {
    const extension = getFileExtension(file.url).toLowerCase();
    
    if (imageExtensions.includes(extension)) {
      imageFiles.push(file);
    } else if (spreadsheetExtensions.includes(extension)) {
      spreadsheetFiles.push(file);
    }
  });

  return { imageFiles, spreadsheetFiles };
}

export function getFileExtension(url: string): string {
  const parts = url.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  return imageExtensions.includes(getFileExtension(filename).toLowerCase());
}

export function classifyImageType(file_url: string): string {
    const extension = getFileExtension(file_url).toLowerCase();
    if (extension === '.jpg' || extension === '.jpeg') {
        return 'image/jpeg';
    } else if (extension === '.png') {
        return 'image/png';
    } else if (extension === '.gif') {
        return 'image/gif';
    }
    return '';
    }

export function isSpreadsheetFile(filename: string): boolean {
  const spreadsheetExtensions = ['.xlsx', '.xls', '.csv'];
  return spreadsheetExtensions.includes(getFileExtension(filename).toLowerCase());
}