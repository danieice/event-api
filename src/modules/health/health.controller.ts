import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOkResponse({ description: 'API and database are reachable' })
  @ApiServiceUnavailableResponse({ description: 'Database unreachable' })
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException('Database unreachable');
    }
  }
}