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
exports.DocumentController = void 0;
const common_1 = require("@nestjs/common");
const document_service_1 = require("./document.service");
const create_document_dto_1 = require("./dto/create-document.dto");
const jwt_guard_1 = require("../auth/guard/jwt.guard");
const swagger_1 = require("@nestjs/swagger");
const edit_document_dto_1 = require("./dto/edit-document.dto");
const edit_prompt_dto_1 = require("./dto/edit-prompt.dto");
let DocumentController = class DocumentController {
    constructor(documentService) {
        this.documentService = documentService;
    }
    findOne(documentId) {
        return this.documentService.findOne(documentId);
    }
    create(createDocumentDto, req) {
        return this.documentService.create(createDocumentDto, req.user.userId);
    }
    deleteDocument(documentId) {
        return this.documentService.deleteDocument(documentId);
    }
    createContent(documentId) {
        return this.documentService.createContent(documentId);
    }
    firstPrompt(documentId) {
        return this.documentService.firstPrompt(documentId);
    }
    edit(editDocumentDto, req) {
        return this.documentService.edit(editDocumentDto, req.user.userId);
    }
    getText(documentId) {
        return this.documentService.getText(documentId);
    }
    editPrompt(editPromptDto) {
        return this.documentService.editPrompt(editPromptDto);
    }
    getDocFile(documentId) {
        return this.documentService.getDocFile(documentId);
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_document_dto_1.CreateDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "deleteDocument", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    (0, common_1.Put)('content/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "createContent", null);
__decorate([
    (0, common_1.Post)('first-prompt/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "firstPrompt", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    (0, common_1.Put)('edit'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [edit_document_dto_1.EditDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "edit", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    (0, common_1.Get)('text/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "getText", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    (0, common_1.Put)('edit-prompt'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [edit_prompt_dto_1.EditPromptDto]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "editPrompt", null);
__decorate([
    (0, common_1.Get)('doc/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentController.prototype, "getDocFile", null);
exports.DocumentController = DocumentController = __decorate([
    (0, common_1.Controller)('document'),
    __metadata("design:paramtypes", [document_service_1.DocumentService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map