import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryEventsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only events that have not started yet' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  upcoming?: boolean;

  @ApiPropertyOptional({ description: 'Search in title or location' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}