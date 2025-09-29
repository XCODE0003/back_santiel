import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { IoAdapter } from '@nestjs/platform-socket.io'
import * as cookieParser from 'cookie-parser'

import { HttpExceptionFilter } from './filters/http-exception.filter'
import { SuccessInterceptor } from './common/interceptors/success.interceptor'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    const configService = app.get<ConfigService>(ConfigService)

    // 🧩 Включаем Socket.IO
    app.useWebSocketAdapter(new IoAdapter(app))

    // 🛡️ Глобальные пайпы (валидация)
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            transformOptions: {
                enableImplicitConversion: true
            }
        })
    )

    // 🍪 Cookie-парсер
    app.use(cookieParser())

    // 🎯 Глобальный фильтр ошибок
    app.useGlobalFilters(new HttpExceptionFilter())

    // 🚀 Интерцептор успешного ответа
    app.useGlobalInterceptors(new SuccessInterceptor())

    // 📦 Глобальный префикс API
    app.setGlobalPrefix('api/v1')

    // 🌐 Разрешаем CORS для фронта
    app.enableCors({
        origin: (
            origin: string,
            callback: (err: Error | null, allow?: boolean) => void
        ) => {
            callback(null, true)
        },
        credentials: true,
        exposedHeaders: ['Set-Cookie']
    })

    // 📘 Swagger-документация
    const config = new DocumentBuilder()
        .setTitle('Casino backend API')
        .setDescription('The casino backend API description')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('casino')
        .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('doc', app, document)

    // 🚀 Стартуем сервер
    const port = Number(configService.get('PORT') || 3000)
    await app.listen(port)

    console.log(`🚀 Server is running on http://localhost:${port}`)
    console.log(`📡 WebSocket available at ws://localhost:${port}`)
}

void bootstrap()
