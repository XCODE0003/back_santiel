// Удалили password-валидацию
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty({ message: 'Почта не должна быть пустой' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsNotEmpty({ message: 'API ключ не должен быть пустым' })
  @MaxLength(100, { message: 'Длина API ключа не должна превышать 100 символов' })
  apiKey: string;

  @IsNotEmpty({ message: 'API ключ не должен быть пустым' })
  @MaxLength(100, { message: 'Длина API ключа не должна превышать 100 символов' })
  cfAccountId: string;
}
