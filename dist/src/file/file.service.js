"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const common_1 = require("@nestjs/common");
const file_entity_1 = require("./entity/file.entity");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const document_entity_1 = require("../document/entity/document.entity");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
});
let FileService = class FileService {
    constructor(fileRepository, documentRepository) {
        this.fileRepository = fileRepository;
        this.documentRepository = documentRepository;
    }
    async uploadFile(file, createFileDto) {
        const document = await this.documentRepository.findOneBy({ id: createFileDto.document_id });
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        const uploadResult = await s3
            .upload({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "input/" + createFileDto.name,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
            .promise();
        const newFile = this.fileRepository.create({
            name: createFileDto.name,
            description: createFileDto.description,
            type: createFileDto.type,
            url: uploadResult.Location,
            document,
        });
        return this.fileRepository.save(newFile);
    }
};
exports.FileService = FileService;
exports.FileService = FileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(file_entity_1.File)),
    __param(1, (0, typeorm_2.InjectRepository)(document_entity_1.Document)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository])
], FileService);
//# sourceMappingURL=file.service.js.map