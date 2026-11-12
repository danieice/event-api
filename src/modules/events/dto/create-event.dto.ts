import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateEventDto {
  @ApiProperty({ example: 'Douala Tech Meetup' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({ example: 'An evening of talks on backend engineering.' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ example: 'Akwa, Douala' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location!: string;

  @ApiProperty({ example: '2026-12-10T17:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @ApiProperty({ example: '2026-12-10T20:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  endsAt!: Date;

  @ApiProperty({ example: 100, minimum: 1, maximum: 100000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  capacity!: number;
}