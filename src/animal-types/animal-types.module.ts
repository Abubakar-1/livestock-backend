import { Module } from '@nestjs/common';
import { AnimalTypesService } from './animal-types.service';
import { AnimalTypesController } from './animal-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AnimalTypesService],
  controllers: [AnimalTypesController],
})
export class AnimalTypesModule {}
