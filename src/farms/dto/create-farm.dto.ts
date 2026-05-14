import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFarmDto {
  @ApiProperty({ example: 'Green Pastures Farm' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Oyo State, Nigeria' })
  @IsString()
  @IsNotEmpty()
  location: string;
}
