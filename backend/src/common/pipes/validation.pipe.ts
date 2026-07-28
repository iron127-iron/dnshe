import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Type,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class EnhancedValidationPipe implements PipeTransform<any> {
  constructor(
    private readonly options?: {
      skipMissingProperties?: boolean;
      whitelist?: boolean;
      forbidNonWhitelisted?: boolean;
      transform?: boolean;
      transformOptions?: { excludeExtraneousValues?: boolean };
    },
  ) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
      ...this.options?.transformOptions,
    });

    const errors = await validate(object, {
      skipMissingProperties: this.options?.skipMissingProperties || false,
      whitelist: this.options?.whitelist ?? true,
      forbidNonWhitelisted: this.options?.forbidNonWhitelisted ?? true,
      transform: this.options?.transform ?? true,
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        details: formattedErrors,
        error: 'BadRequest',
      });
    }

    return object;
  }

  private toValidate(metatype: Type<any>): boolean {
    const types: Type<any>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(
    errors: ValidationError[],
    parentProperty?: string,
  ): any[] {
    const formatted: any[] = [];

    for (const error of errors) {
      const propertyPath = parentProperty
        ? `${parentProperty}.${error.property}`
        : error.property;

      if (error.constraints) {
        formatted.push({
          field: propertyPath,
          constraints: Object.values(error.constraints),
        });
      }

      if (error.children && error.children.length > 0) {
        formatted.push(...this.formatErrors(error.children, propertyPath));
      }
    }

    return formatted;
  }
}
