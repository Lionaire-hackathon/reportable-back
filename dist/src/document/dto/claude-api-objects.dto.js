"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeImageApiObject = void 0;
class ClaudeImageApiObject {
    constructor(description, name, data, media_type) {
        this.description = description;
        this.name = name;
        this.data = data;
        this.media_type = media_type;
    }
    gen_content() {
        return [{ "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": this.media_type,
                    "data": this.data,
                }
            }, { "type": "text", "text": `Image Name: ${this.name}` }];
    }
}
exports.ClaudeImageApiObject = ClaudeImageApiObject;
;
//# sourceMappingURL=claude-api-objects.dto.js.map