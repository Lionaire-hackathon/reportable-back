import { Injectable } from '@nestjs/common';
// import Queue from 'queue-promise'; // 이 줄을 주석 처리합니다.
const Queue = require('queue-promise'); // require 방식으로 Queue 가져오기

@Injectable()
export class ApiKeyService {
  private apiKeys: string[];
  private queues: Map<string, any>;

  constructor() {
    this.apiKeys = [
      process.env.ANTHROPIC_API_KEY_1,
      process.env.ANTHROPIC_API_KEY_2,
      process.env.ANTHROPIC_API_KEY_3,
      process.env.ANTHROPIC_API_KEY_4,
    ];
    this.queues = new Map();

    this.apiKeys.forEach(key => {
      this.queues.set(key, new Queue({ concurrent: 1, interval: 1000 }));
    });
  }

  async executeTask<T>(task: (apiKey: string) => Promise<T>): Promise<T> {
    const apiKey = this.getLeastBusyApiKey();
    const queue = this.queues.get(apiKey);

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
      const leastBusyQueue = this.queues.get(leastBusyKey);
      const currentQueue = this.queues.get(currentKey);
      return currentQueue.size < leastBusyQueue.size ? currentKey : leastBusyKey;
    });
  }
}
