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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDocumentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const document_entity_1 = require("../entity/document.entity");
class CreateDocumentDto {
}
exports.CreateDocumentDto = CreateDocumentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'The title of the document',
        description: 'The title of the document',
    }),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 3000,
        description: 'The content of the document',
    }),
    __metadata("design:type", Number)
], CreateDocumentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'essay',
        description: 'The type of the post',
    }),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'The prompt of the document',
        description: 'The prompt of the document',
    }),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'The format of essay',
        description: 'The format of essay',
    }),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "form", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'The elements of research paper',
        description: 'The elements of research paper',
    }),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "elements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'The core contents of research paper',
        description: 'The core contents of research paper',
    }),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "core", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: "retrieval",
        description: "output of the retriever",
    }),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "retrieval", void 0);
//# sourceMappingURL=create-document.dto.js.map