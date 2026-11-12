import { PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';

// every field optional, same validation rules
export class UpdateEventDto extends PartialType(CreateEventDto) {}