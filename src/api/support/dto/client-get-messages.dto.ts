import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ClientGetMessagesQueryDto {
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt({
        message: 'ID должен быть целым числом'
    })
    @Min(0, {
        message: 'ID должен быть не меньше 0'
    })
    lastMessageId: number;
}
