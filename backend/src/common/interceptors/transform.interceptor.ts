import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
  path: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'success' in response) {
          return response;
        }

        const result: SuccessResponse<T> = {
          success: true,
          data: response,
          timestamp: new Date().toISOString(),
          path,
        };

        if (
          response &&
          typeof response === 'object' &&
          'items' in response &&
          'total' in response
        ) {
          result.data = response.items;
          result.meta = {
            total: response.total,
            page: parseInt(request.query.page as string) || 1,
            limit: parseInt(request.query.limit as string) || 10,
            totalPages: Math.ceil(
              response.total / (parseInt(request.query.limit as string) || 10),
            ),
          };
        }

        return result;
      }),
    );
  }
}
