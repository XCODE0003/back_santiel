import { Length } from 'class-validator'

export class GetArticleByPathDto {
    @Length(1, 255, {
        message: 'Путь должен быть от 1 до 255 символов'
    })
    path: string
}
