import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class EditAccountParamsDto {
  @Type(() => Number)
  @IsNotEmpty()
  id: number;
}

export class EditAccountDto {
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsNotEmpty({ message: 'API ключ не должен быть пустым' })
  @MaxLength(100, { message: 'Длина API ключа не должна превышать 100 символов' })
  apiKey: string;

  id: number;
}