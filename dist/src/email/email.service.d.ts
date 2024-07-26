export declare class EmailService {
    private transporter;
    constructor();
    sendVerificationMail(to: string, code: string): Promise<void>;
}
