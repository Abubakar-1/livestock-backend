import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BatchStatus, HealthStatus } from '@prisma/client';
import { Type } from 'class-transformer';

class FarmAllocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  farmId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class CreateBatchDto {
  @ApiProperty({ example: 'Boer Goats Q2' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Premium quality Boer goats...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-of-animal-type' })
  @IsString()
  @IsNotEmpty()
  animalTypeId: string;

  @ApiProperty({ type: [FarmAllocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FarmAllocationDto)
  farms: FarmAllocationDto[];

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsNotEmpty()
  animalPrice: number;

  @ApiProperty({ example: 3500 })
  @IsNumber()
  @IsNotEmpty()
  feedingFee: number;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @IsNotEmpty()
  medicationFee: number;

  @ApiProperty({ example: 70000 })
  @IsNumber()
  @IsNotEmpty()
  estimatedSalePriceLow: number;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  @IsNotEmpty()
  estimatedSalePriceHigh: number;

  @ApiProperty({ example: '2024-05-01' })
  @IsNotEmpty()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2025-05-01' })
  @IsNotEmpty()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ example: '2024-04-01' })
  @IsOptional()
  @Type(() => Date)
  campaignStartDate?: Date;

  @ApiProperty({ example: '2024-04-30' })
  @IsOptional()
  @Type(() => Date)
  campaignEndDate?: Date;

  @ApiProperty({ example: 60000 })
  @IsNumber()
  @IsOptional()
  currentMarketValueLow?: number;

  @ApiProperty({ example: 65000 })
  @IsNumber()
  @IsOptional()
  currentMarketValueHigh?: number;

  @ApiProperty({ enum: BatchStatus, default: BatchStatus.OPEN })
  @IsEnum(BatchStatus)
  @IsOptional()
  status?: BatchStatus;

  @ApiProperty({ enum: HealthStatus, default: HealthStatus.EXCELLENT })
  @IsEnum(HealthStatus)
  @IsOptional()
  healthStatus?: HealthStatus;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isCampaignOpen?: boolean;
}
