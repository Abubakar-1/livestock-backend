import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnimalTypesService } from './animal-types.service';
import { ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Animal Types')
@Controller('animal-types')
export class AnimalTypesController {
  constructor(private readonly animalTypesService: AnimalTypesService) {}

  @Post()
  @ResponseMessage('Animal type created')
  create(@Body() body: { name: string; description?: string }) {
    return this.animalTypesService.create(body);
  }

  @Get()
  @ResponseMessage('Animal types retrieved')
  findAll() {
    return this.animalTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animalTypesService.findOne(id);
  }
}
