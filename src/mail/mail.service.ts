import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class MailService {
  constructor(private readonly logger: LoggerService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async sendRecoverCode(_email: string, _code: string) {
    this.logger.log('Sending recover code', { email: _email });
    return true;
  }
}
