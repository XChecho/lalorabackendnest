import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseWrapper<T> {
  data: T;
  success: boolean;
  message: string;
}

@Injectable()
export class SuccessResponseInterceptor<T>
  implements NestInterceptor<T, ResponseWrapper<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseWrapper<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        success: true,
        message: 'Operation successful',
      })),
    );
  }
}