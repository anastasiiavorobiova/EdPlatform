import { Injectable } from '@nestjs/common';

/** Provides the greeting returned by AppController. */
@Injectable()
export class AppService {
  /** Returns the static greeting text. */
  getHello(): string {
    return 'Hello World!';
  }
}
