import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BankDetailsService } from './bank-details.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Bank Details')
@Controller('bank-details')
export class BankDetailsController {
  constructor(private readonly bankDetailsService: BankDetailsService) {}

  @Get()
  @ApiOperation({ summary: 'Get bank details for payment' })
  @ResponseMessage('Bank details retrieved successfully')
  getDetails() {
    return this.bankDetailsService.getDetails();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update bank details (Admin only)' })
  @ResponseMessage('Bank details updated successfully')
  update(@Body() body: { accountNumber: string; bankName: string; accountName: string }) {
    return this.bankDetailsService.updateDetails(body);
  }
}
