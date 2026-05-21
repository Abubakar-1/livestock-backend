import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FarmsService } from './farms.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { TrackActivity } from '../common/decorators/track-activity.decorator';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';

import { UpdateInventoryDto } from './dto/update-inventory.dto';

@ApiTags('Farms')
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  @TrackActivity('Farm Created', 'Farm')
  @ResponseMessage('Farm created successfully')
  create(@Body() createFarmDto: CreateFarmDto) {
    return this.farmsService.create(createFarmDto);
  }

  @Get()
  @ResponseMessage('Farms retrieved successfully')
  findAll() {
    return this.farmsService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Farm details retrieved')
  findOne(@Param('id') id: string) {
    return this.farmsService.findOne(id);
  }

  @Patch(':id')
  @TrackActivity('Farm Updated', 'Farm')
  @ResponseMessage('Farm updated successfully')
  update(@Param('id') id: string, @Body() updateFarmDto: UpdateFarmDto) {
    return this.farmsService.update(id, updateFarmDto);
  }

  @Post(':id/inventory')
  @TrackActivity('Farm Inventory Updated', 'Farm')
  @ResponseMessage('Farm inventory updated')
  addInventory(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    if (updateInventoryDto.mode === 'set') {
      return this.farmsService.setAnimals(id, updateInventoryDto.animalTypeId, updateInventoryDto.quantity);
    }
    return this.farmsService.addAnimals(id, updateInventoryDto.animalTypeId, updateInventoryDto.quantity);
  }

  @Delete(':id')
  @TrackActivity('Farm Deleted', 'Farm')
  @ResponseMessage('Farm deleted successfully')
  remove(@Param('id') id: string) {
    return this.farmsService.remove(id);
  }
}
