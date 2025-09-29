import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()
        const status = exception.getStatus()
        const exceptionResponse: any = exception.getResponse()

        response.status(HttpStatus.OK).json({
            // TODO: fix eslint error
            message: String(exceptionResponse?.message) || exception.message,
            statusCode: status,
            success: false,
            timestamp: new Date().toISOString(),
            path: request.url
        })
    }
}
