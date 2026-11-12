import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto, PaginatedEventsDto } from './dto/event-response.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiCreatedResponse({ type: EventResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input or schedule' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEventDto): Promise<EventResponseDto> {
    return this.eventsService.create(user.id, dto);
  }

  @Get()
  @ApiOkResponse({ type: PaginatedEventsDto })
  findAll(@Query() query: QueryEventsDto): Promise<PaginatedEventsDto> {
    return this.eventsService.findAll(query);
  }

  // declared before ':id' so "mine" isn't treated as an id
  @Get('mine')
  @ApiOkResponse({ type: PaginatedEventsDto, description: 'Events created by the current user' })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryEventsDto,
  ): Promise<PaginatedEventsDto> {
    return this.eventsService.findAll(query, user.id);
  }

  @Get(':id')
  @ApiOkResponse({ type: EventResponseDto })
  @ApiNotFoundResponse({ description: 'Event not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EventResponseDto> {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: EventResponseDto })
  @ApiForbiddenResponse({ description: 'Not the event owner' })
  @ApiConflictResponse({ description: 'Capacity below current registrations' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Event deleted' })
  @ApiForbiddenResponse({ description: 'Not the event owner' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.eventsService.remove(id, user.id);
  }
}