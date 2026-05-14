import { IsString, IsNotEmpty, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInventoryDto {
  @ApiProperty({ example: 'uuid-of-animal-type' })
  @IsString()
  @IsNotEmpty()
  animalTypeId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ enum: ['add', 'set'], example: 'add' })
  @IsEnum(['add', 'set'])
  mode: 'add' | 'set';
}
