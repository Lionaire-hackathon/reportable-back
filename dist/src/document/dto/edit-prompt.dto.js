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
exports.EditPromptDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class EditPromptDto {
}
exports.EditPromptDto = EditPromptDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'The url of document in s3',
        description: 'The url of document in s3',
    }),
    __metadata("design:type", Number)
], EditPromptDto.prototype, "documentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Additional q&a prompt from user',
        description: 'Additional q$a prompt from user',
    }),
    __metadata("design:type", String)
], EditPromptDto.prototype, "addPrompt", void 0);
//# sourceMappingURL=edit-prompt.dto.js.map