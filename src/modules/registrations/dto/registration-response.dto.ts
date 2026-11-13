import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { Event } from '../../events/entities/event.entity';
import { Registration } from '../entities/registration.entity';

export class RegisteredEventDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  startsAt!: Date;

  @ApiProperty()
  endsAt!: Date;
}

export class RegistrationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  registeredAt!: Date;

  @ApiProperty({ type: RegisteredEventDto })
  event!: RegisteredEventDto;

  static from(registration: Registration, event: Event): RegistrationResponseDto {
    return {
      id: registration.id,
      registeredAt: registration.registeredAt,
      event: {
        id: event.id,
        title: event.title,
        location: event.location,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
      },
    };
  }
}

export class PaginatedRegistrationsDto {
  @ApiProperty({ type: [RegistrationResponseDto] })
  data!: RegistrationResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}