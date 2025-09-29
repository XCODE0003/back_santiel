import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreatePageDto {
    @IsString({
        message: 'Заголовок страницы должен быть строкой'
    })
    @IsNotEmpty({
        message: 'Заголовок страницы не может быть пустым'
    })
    @MaxLength(255, {
        message: 'Заголовок страницы не может превышать 255 символов'
    })
    title: string

    @IsString({
        message: 'Ссылка на страницу не должна быть пустой'
    })
    @IsNotEmpty({
        message: 'Ссылка на страницу не может быть пустой'
    })
    @MaxLength(255, {
        message: 'Ссылка на страницу не может превышать 255 символов'
    })
    path: string

    @IsString({
        message: 'Контент страницы должен быть строкой'
    })
    @IsNotEmpty({
        message: 'Контент страницы не может быть пустым'
    })
    @MaxLength(15000, {
        message: 'Контент страницы не может превышать 15000 символов'
    })
    content: string
}
