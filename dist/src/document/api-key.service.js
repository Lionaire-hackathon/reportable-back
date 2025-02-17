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
exports.ApiKeyService = void 0;
const common_1 = require("@nestjs/common");
const Queue = require('queue-promise');
let ApiKeyService = class ApiKeyService {
    constructor() {
        this.apiKeys = [
            process.env.ANTHROPIC_API_KEY_1,
            process.env.ANTHROPIC_API_KEY_2,
            process.env.ANTHROPIC_API_KEY_3,
            process.env.ANTHROPIC_API_KEY_4,
        ];
        this.queues = new Map();
        this.queueSizes = new Map();
        this.apiKeys.forEach(key => {
            const queue = new Queue({ concurrent: 1, interval: 1000 });
            this.queues.set(key, queue);
            this.queueSizes.set(key, 0);
            queue.on('start', () => {
                this.queueSizes.set(key, this.queueSizes.get(key) + 1);
            });
            queue.on('end', () => {
                this.queueSizes.set(key, this.queueSizes.get(key) - 1);
            });
        });
    }
    async executeTask(task) {
        const apiKey = this.getLeastBusyApiKey();
        const queue = this.queues.get(apiKey);
        console.log('api key index: ', this.apiKeys.indexOf(apiKey));
        return new Promise((resolve, reject) => {
            queue.enqueue(async () => {
                try {
                    const result = await task(apiKey);
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    getLeastBusyApiKey() {
        return this.apiKeys.reduce((leastBusyKey, currentKey) => {
            const leastBusySize = this.queueSizes.get(leastBusyKey);
            const currentSize = this.queueSizes.get(currentKey);
            return currentSize < leastBusySize ? currentKey : leastBusyKey;
        });
    }
};
exports.ApiKeyService = ApiKeyService;
exports.ApiKeyService = ApiKeyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ApiKeyService);
//# sourceMappingURL=api-key.service.js.map