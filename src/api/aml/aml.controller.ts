import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AmlService } from './aml.service';
import { VerifyAmlDto } from './dto/verify-aml.dto';
import { Auth } from '@/common/decorators/auth.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';

@Controller('aml')
export class AmlController {
  constructor(private readonly amlService: AmlService) {}

  @Auth()
  @Get('status')
  getStatus(@CurrentUser('id') userId: number) {
    return this.amlService.getStatus(userId);
  }

  @Auth()
  @Post('verify')
  verify(
    @CurrentUser('id') userId: number,
    @Body() dto: VerifyAmlDto
  ) {
    return this.amlService.verifyCode(userId, dto.amlCode);
  }
}