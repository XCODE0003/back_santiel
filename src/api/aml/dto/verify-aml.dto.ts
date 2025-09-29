import { IsString, Length } from 'class-validator';

export class VerifyAmlDto {
  @IsString()
  @Length(5, 100)
  amlCode: string;
}