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
exports.EditDocumentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class EditDocumentDto {
}
exports.EditDocumentDto = EditDocumentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'The url of document in s3',
    }),
    __metadata("design:type", Number)
], EditDocumentDto.prototype, "document_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Add 5 to document',
        description: 'edit prompt; the thing you want to edit in document',
    }),
    __metadata("design:type", String)
], EditDocumentDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '1',
        description: 'Content to be edited',
    }),
    __metadata("design:type", String)
], EditDocumentDto.prototype, "content_before", void 0);
//# sourceMappingURL=edit-document.dto.js.map