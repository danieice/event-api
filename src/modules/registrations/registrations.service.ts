import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { isUniqueViolation } from '../../common/utils/db-errors';
import { Event } from '../events/entities/event.entity';
import {
  PaginatedRegistrationsDto,
  RegistrationResponseDto,
} from './dto/registration-response.dto';
import { Registration } from './entities/registration.entity';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Registration) private readonly registrations: Repository<Registration>,
  ) {}

  register(userId: string, eventId: string): Promise<RegistrationResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      // Lock the event row. Concurrent registrations for the same event wait
      // here one at a time, so two people can never both take the last seat.
      const event = await manager.findOne(Event, {
        where: { id: eventId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!event) throw new NotFoundException('Event not found');

      if (event.startsAt <= new Date()) {
        throw new BadRequestException('Registration is closed, this event has already started');
      }

      const alreadyRegistered = await manager.exists(Registration, { where: { userId, eventId } });
      if (alreadyRegistered) {
        throw new ConflictException('You are already registered for this event');
      }

      const registeredCount = await manager.count(Registration, { where: { eventId } });
      if (registeredCount >= event.capacity) {
        throw new ConflictException('This event is full');
      }

      try {
        const registration = await manager.save(manager.create(Registration, { userId, eventId }));
        return RegistrationResponseDto.from(registration, event);
      } catch (error) {
        // backstop: the unique constraint catches anything the check above missed
        if (isUniqueViolation(error)) {
          throw new ConflictException('You are already registered for this event');
        }
        throw error;
      }
    });
  }

  async cancel(userId: string, eventId: string): Promise<void> {
    const registration = await this.registrations.findOne({
      where: { userId, eventId },
      relations: { event: true },
    });
    if (!registration) {
      throw new NotFoundException('You are not registered for this event');
    }
    if (registration.event.startsAt <= new Date()) {
      throw new BadRequestException('You cannot cancel after the event has started');
    }
    await this.registrations.delete({ id: registration.id });
  }

  async findMine(userId: string, query: PaginationQueryDto): Promise<PaginatedRegistrationsDto> {
    const [registrations, total] = await this.registrations.findAndCount({
      where: { userId },
      relations: { event: true },
      order: { event: { startsAt: 'ASC' } },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data: registrations.map((registration) =>
        RegistrationResponseDto.from(registration, registration.event),
      ),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}