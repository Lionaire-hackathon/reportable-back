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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let EmailService = class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_KEY,
            },
        });
    }
    async sendVerificationMail(to, code) {
        const message = {
            from: process.env.GMAIL_USER,
            to: to,
            subject: 'Your Verification Code',
            html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Verification Code</h2>
        <p>Thank you for registering. Please use the following verification code to complete your sign-up process:</p>
        <h3 style="color: #d32f2f;">${code}</h3>
        <p>This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
        <p>Best regards,<br>Reportable</p>
      </div>
    `,
        };
        await this.transporter.sendMail(message);
    }
    async sendMail(to, subject, html) {
        const message = {
            from: process.env.GMAIL_USER,
            to: to,
            subject: subject,
            html: html,
        };
        await this.transporter.sendMail(message);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map