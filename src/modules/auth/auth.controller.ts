import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTooManyRequestsResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @ApiTooManyRequestsResponse({ description: 'Too many attempts, try again in a minute' })
  @Post('register')
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiConflictResponse({ description: 'Email already registered' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @ApiTooManyRequestsResponse({ description: 'Too many attempts, try again in a minute' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser() current: AuthUser): Promise<UserResponseDto> {
    const user = await this.usersService.findById(current.id);
    if (!user) throw new NotFoundException('User no longer exists');
    return UserResponseDto.from(user);
  }
}