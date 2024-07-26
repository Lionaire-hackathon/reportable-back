export declare class ClaudeImageApiObject {
    description: string;
    name: string;
    data: string;
    media_type: string;
    constructor(description: string, name: string, data: string, media_type: string);
    gen_content(): ({
        type: string;
        source: {
            type: string;
            media_type: string;
            data: string;
        };
        text?: undefined;
    } | {
        type: string;
        text: string;
        source?: undefined;
    })[];
}
