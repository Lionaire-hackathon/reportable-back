"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentModule = void 0;
const common_1 = require("@nestjs/common");
const document_service_1 = require("./document.service");
const document_controller_1 = require("./document.controller");
const user_entity_1 = require("../users/entity/user.entity");
const document_entity_1 = require("./entity/document.entity");
const typeorm_1 = require("@nestjs/typeorm");
const file_entity_1 = require("../file/entity/file.entity");
const edit_entity_1 = require("./entity/edit.entity");
let DocumentModule = class DocumentModule {
};
exports.DocumentModule = DocumentModule;
exports.DocumentModule = DocumentModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, document_entity_1.Document, file_entity_1.File, edit_entity_1.Edit])],
        providers: [document_service_1.DocumentService],
        controllers: [document_controller_1.DocumentController]
    })
], DocumentModule);
//# sourceMappingURL=document.module.js.map