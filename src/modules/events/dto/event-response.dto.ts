import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { Event } from '../entities/event.entity';

export class EventOwnerDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Ada Obi' })
  fullName!: string;
}

export class EventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  startsAt!: Date;

  @ApiProperty()
  endsAt!: Date;

  @ApiProperty({ example: 100 })
  capacity!: number;

  @ApiProperty({ example: 37 })
  registeredCount!: number;

  @ApiProperty({ example: 63 })
  spotsLeft!: number;

  @ApiProperty({ type: EventOwnerDto })
  owner!: EventOwnerDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(event: Event, registeredCount: number): EventResponseDto {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      capacity: event.capacity,
      registeredCount,
      spotsLeft: Math.max(event.capacity - registeredCount, 0),
      owner: { id: event.owner.id, fullName: event.owner.fullName },
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}

export class PaginatedEventsDto {
  @ApiProperty({ type: [EventResponseDto] })
  data!: EventResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}