import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendRecoverCode(email: string, code: string) {
    console.log(`Sending recover code ${code} to ${email}`);
    return true;
  }
}
