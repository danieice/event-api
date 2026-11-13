import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class RootController {
  @Public()
  @Get()
  @ApiOkResponse({ description: 'API information and useful links' })
  info() {
    return {
      name: 'Event Management API',
      version: '1.0.0',
      docs: '/docs',
      health: '/api/health',
    };
  }
}