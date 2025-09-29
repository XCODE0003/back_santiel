import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class EditFaqDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsInt()
  categoryId: number;
}
