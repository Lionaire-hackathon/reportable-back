export declare class ApiKeyService {
    private apiKeys;
    private queues;
    private queueSizes;
    constructor();
    executeTask<T>(task: (apiKey: string) => Promise<T>): Promise<T>;
    private getLeastBusyApiKey;
}
