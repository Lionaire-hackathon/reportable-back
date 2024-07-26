"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = zip;
exports.classifyFiles = classifyFiles;
exports.getFileExtension = getFileExtension;
exports.isImageFile = isImageFile;
exports.classifyImageType = classifyImageType;
exports.isSpreadsheetFile = isSpreadsheetFile;
function zip(...arrays) {
    const minLength = Math.min(...arrays.map(arr => arr.length));
    const zipped = [];
    for (let i = 0; i < minLength; i++) {
        const row = arrays.map(arr => arr[i]);
        zipped.push(row);
    }
    return zipped;
}
function classifyFiles(files) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const spreadsheetExtensions = ['.xlsx', '.xls', '.csv'];
    const imageFiles = [];
    const spreadsheetFiles = [];
    files.forEach(file => {
        const extension = getFileExtension(file.url).toLowerCase();
        if (imageExtensions.includes(extension)) {
            imageFiles.push(file);
        }
        else if (spreadsheetExtensions.includes(extension)) {
            spreadsheetFiles.push(file);
        }
    });
    return { imageFiles, spreadsheetFiles };
}
function getFileExtension(url) {
    const parts = url.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}
function isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    return imageExtensions.includes(getFileExtension(filename).toLowerCase());
}
function classifyImageType(file_url) {
    const extension = getFileExtension(file_url).toLowerCase();
    if (extension === '.jpg' || extension === '.jpeg') {
        return 'image/jpeg';
    }
    else if (extension === '.png') {
        return 'image/png';
    }
    else if (extension === '.gif') {
        return 'image/gif';
    }
    return '';
}
function isSpreadsheetFile(filename) {
    const spreadsheetExtensions = ['.xlsx', '.xls', '.csv'];
    return spreadsheetExtensions.includes(getFileExtension(filename).toLowerCase());
}
//# sourceMappingURL=file-utils.js.map