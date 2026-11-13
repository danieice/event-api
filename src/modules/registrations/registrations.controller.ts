import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import {
  PaginatedRegistrationsDto,
  RegistrationResponseDto,
} from './dto/registration-response.dto';
import { RegistrationsService } from './registrations.service';

@ApiTags('Registrations')
@ApiBearerAuth()
@Controller()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('events/:eventId/registrations')
  @ApiCreatedResponse({ type: RegistrationResponseDto })
  @ApiNotFoundResponse({ description: 'Event not found' })
  @ApiConflictResponse({ description: 'Already registered, or the event is full' })
  @ApiBadRequestResponse({ description: 'Event has already started' })
  register(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<RegistrationResponseDto> {
    return this.registrationsService.register(user.id, eventId);
  }

  @Delete('events/:eventId/registrations/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Registration cancelled' })
  @ApiNotFoundResponse({ description: 'Not registered for this event' })
  @ApiBadRequestResponse({ description: 'Event has already started' })
  cancel(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.registrationsService.cancel(user.id, eventId);
  }

  @Get('registrations/me')
  @ApiOkResponse({ type: PaginatedRegistrationsDto })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedRegistrationsDto> {
    return this.registrationsService.findMine(user.id, query);
  }
}