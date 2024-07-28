import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_KEY,
      },
    });
  }

  async sendVerificationMail(to: string, code: string): Promise<void> {
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

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const message = {
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject,
      html: html,
    };
    await this.transporter.sendMail(message);
  }
}
