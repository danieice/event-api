import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from '../registrations/entities/registration.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto, PaginatedEventsDto } from './dto/event-response.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly events: Repository<Event>,
    @InjectRepository(Registration) private readonly registrations: Repository<Registration>,
  ) {}

  async create(ownerId: string, dto: CreateEventDto): Promise<EventResponseDto> {
    this.assertValidSchedule(dto.startsAt, dto.endsAt, true);
    const saved = await this.events.save(this.events.create({ ...dto, ownerId }));
    return this.findOne(saved.id);
  }

  async findAll(query: QueryEventsDto, ownerId?: string): Promise<PaginatedEventsDto> {
    const qb = this.withOwner()
      .orderBy('event.startsAt', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (ownerId) qb.andWhere('event.ownerId = :ownerId', { ownerId });
    if (query.upcoming) qb.andWhere('event.startsAt > :now', { now: new Date() });
    if (query.search) {
      qb.andWhere('(event.title ILIKE :search OR event.location ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [events, total] = await qb.getManyAndCount();
    const counts = await this.countRegistrations(events.map((event) => event.id));

    return {
      data: events.map((event) => EventResponseDto.from(event, counts.get(event.id) ?? 0)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string): Promise<EventResponseDto> {
    const event = await this.withOwner().where('event.id = :id', { id }).getOne();
    if (!event) throw new NotFoundException('Event not found');

    const counts = await this.countRegistrations([id]);
    return EventResponseDto.from(event, counts.get(id) ?? 0);
  }

  async update(id: string, userId: string, dto: UpdateEventDto): Promise<EventResponseDto> {
    const event = await this.findOwnedOrFail(id, userId);

    this.assertValidSchedule(
      dto.startsAt ?? event.startsAt,
      dto.endsAt ?? event.endsAt,
      dto.startsAt !== undefined,
    );

    if (dto.capacity !== undefined) {
      const registered = (await this.countRegistrations([id])).get(id) ?? 0;
      if (dto.capacity < registered) {
        throw new ConflictException(
          `Capacity cannot be lower than the ${registered} people already registered`,
        );
      }
    }

    await this.events.save(this.events.merge(event, dto));
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOwnedOrFail(id, userId);
    // registrations go with it via ON DELETE CASCADE
    await this.events.delete({ id });
  }

  private withOwner() {
    return this.events
      .createQueryBuilder('event')
      .leftJoin('event.owner', 'owner')
      .addSelect(['owner.id', 'owner.fullName']);
  }

  private async findOwnedOrFail(id: string, userId: string): Promise<Event> {
    const event = await this.events.findOneBy({ id });
    if (!event) throw new NotFoundException('Event not found');
    if (event.ownerId !== userId) {
      throw new ForbiddenException('You can only manage events you created');
    }
    return event;
  }

  private assertValidSchedule(startsAt: Date, endsAt: Date, mustBeFuture: boolean): void {
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    if (mustBeFuture && startsAt <= new Date()) {
      throw new BadRequestException('startsAt must be in the future');
    }
  }

  // one grouped query for the whole page instead of one query per event
  private async countRegistrations(eventIds: string[]): Promise<Map<string, number>> {
    if (eventIds.length === 0) return new Map();

    const rows = await this.registrations
      .createQueryBuilder('registration')
      .select('registration.eventId', 'eventId')
      .addSelect('COUNT(*)::int', 'count')
      .where('registration.eventId IN (:...eventIds)', { eventIds })
      .groupBy('registration.eventId')
      .getRawMany<{ eventId: string; count: number }>();

    return new Map(rows.map((row) => [row.eventId, row.count]));
  }
}