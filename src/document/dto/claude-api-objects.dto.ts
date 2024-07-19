export class ClaudeImageApiObject {
    description: string;
    name: string;
    data: string;
    media_type: string;

    constructor(description: string, name: string, data: string, media_type: string) {
        this.description = description;
        this.name = name;
        this.data = data;
        this.media_type = media_type;
    }
    
    gen_content() {
        return [{"type": "image",
            "source": {
                "type": "base64",
                "media_type": this.media_type,
                "data": this.data,
            }
        }, {"type": "text", "text": `Image Name: ${this.name}`}];
    }
};