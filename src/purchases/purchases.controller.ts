import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { TrackActivity } from '../common/decorators/track-activity.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @TrackActivity('Order Placed', 'Investment')
  @ResponseMessage('Order placed successfully. Awaiting payment.')
  create(@Request() req, @Body() body: { batchId: string; units: number }) {
    return this.purchasesService.create(req.user.id, body.batchId, body.units);
  }

  @Get()
  @ResponseMessage('User purchases retrieved')
  findAll(@Request() req) {
    return this.purchasesService.findAllByUser(req.user.id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ResponseMessage('All system purchases retrieved')
  findAllAdmin() {
    return this.purchasesService.findAll();
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.purchasesService.findOne(id, req.user.id);
  }

  @Patch(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @TrackActivity('Asset Purchased', 'Investment')
  @ResponseMessage('Payment verified and asset purchased successfully')
  confirm(@Param('id') id: string) {
    return this.purchasesService.confirmPurchase(id);
  }

  @Patch(':id/cancel')
  @TrackActivity('Order Cancelled', 'Investment')
  @ResponseMessage('Order cancelled successfully')
  cancel(@Request() req, @Param('id') id: string) {
    return this.purchasesService.cancelPurchase(id, req.user.id);
  }
}
