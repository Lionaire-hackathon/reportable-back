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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entity/user.entity");
const typeorm_2 = require("typeorm");
const identity_entity_1 = require("../auth/entity/identity.entity");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(userRepository, identityRepository) {
        this.userRepository = userRepository;
        this.identityRepository = identityRepository;
    }
    async createUser(createUserDto) {
        const newUser = this.userRepository.create({
            role: user_entity_1.Role.user,
            ...createUserDto,
        });
        await this.userRepository.save(newUser);
        return newUser;
    }
    async findOne(email) {
        return this.userRepository.findOneBy({
            email: email
        });
    }
    async findOneById(id) {
        return this.userRepository.findOneBy({ id });
    }
    async updateUser(id, updateUserDto) {
        const { name, email, password } = updateUserDto;
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        }
        await this.userRepository.update(id, {
            name: name || user.name,
            email: email || user.email,
        });
        const identity = await this.identityRepository.findOne({
            where: { user: user },
        });
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await this.identityRepository.update(identity.id, {
                password: hashedPassword,
            });
        }
        return this.findOneById(id);
    }
    async removeUser(id) {
        await this.userRepository.delete(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(identity_entity_1.Identity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map