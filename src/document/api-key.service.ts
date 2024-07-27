import { Injectable } from '@nestjs/common';
const Queue = require('queue-promise');

@Injectable()
export class ApiKeyService {
  private apiKeys: string[];
  private queues: Map<string, any>;
  private queueSizes: Map<string, number>;

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

  async executeTask<T>(task: (apiKey: string) => Promise<T>): Promise<T> {
    const apiKey = this.getLeastBusyApiKey();
    const queue = this.queues.get(apiKey);
    console.log('api key index: ', this.apiKeys.indexOf(apiKey));

    return new Promise((resolve, reject) => {
      queue.enqueue(async () => {
        try {
          const result = await task(apiKey);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private getLeastBusyApiKey(): string {
    return this.apiKeys.reduce((leastBusyKey, currentKey) => {
      const leastBusySize = this.queueSizes.get(leastBusyKey);
      const currentSize = this.queueSizes.get(currentKey);
      return currentSize < leastBusySize ? currentKey : leastBusyKey;
    });
  }
}
