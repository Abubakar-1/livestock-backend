import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { TrackActivity } from '../common/decorators/track-activity.decorator';
import { HealthStatus, BatchStatus } from '@prisma/client';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@ApiTags('Batches')
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @TrackActivity('Batch Created', 'Batch')
  @ResponseMessage('Batch created and inventory pledged')
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchesService.create(createBatchDto);
  }

  @Get()
  @ResponseMessage('Batches retrieved')
  findAll() {
    return this.batchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch(':id')
  @TrackActivity('Batch Updated', 'Batch')
  @ResponseMessage('Batch updated')
  update(@Param('id') id: string, @Body() updateBatchDto: UpdateBatchDto) {
    return this.batchesService.update(id, updateBatchDto);
  }

  @Patch(':id/health')
  @TrackActivity('Batch Health Updated', 'Batch')
  updateHealth(@Param('id') id: string, @Body('status') status: HealthStatus) {
    return this.batchesService.updateHealth(id, status);
  }

  @Patch(':id/status')
  @TrackActivity('Batch Status Updated', 'Batch')
  updateStatus(@Param('id') id: string, @Body('status') status: BatchStatus) {
    return this.batchesService.updateStatus(id, status);
  }

  @Patch(':id/end')
  @TrackActivity('Batch Ended', 'Batch')
  @ResponseMessage('Batch ended successfully')
  endBatch(@Param('id') id: string) {
    return this.batchesService.endBatch(id);
  }

  @Patch(':id/final-price')
  @TrackActivity('Final Sale Price Set', 'Batch')
  @ResponseMessage('Final sale price set and payouts computed')
  setFinalPrice(@Param('id') id: string, @Body('finalSalePrice') finalSalePrice: number) {
    return this.batchesService.setFinalPrice(id, finalSalePrice);
  }

  @Patch(':id/investments/:investmentId/mark-paid')
  @TrackActivity('Payout Marked as Paid', 'Batch')
  @ResponseMessage('Investment payout marked as paid')
  markInvestmentPaid(
    @Param('id') id: string,
    @Param('investmentId') investmentId: string,
  ) {
    return this.batchesService.markInvestmentPaid(id, investmentId);
  }

  @Patch(':id/mark-all-paid')
  @TrackActivity('All Payouts Marked as Paid', 'Batch')
  @ResponseMessage('All pending payouts marked as paid')
  markAllPaid(@Param('id') id: string) {
    return this.batchesService.markAllPaid(id);
  }
}
