import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { TrackActivity } from '../common/decorators/track-activity.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for auth
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @TrackActivity('Account Created', 'User')
  @ResponseMessage('Account created successfully')
  @ApiOperation({ summary: 'Register a new normal user (Owner)' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @TrackActivity('User Login', 'User')
  @ResponseMessage('Login successful')
  @ApiOperation({ summary: 'Login for normal user (Owner)' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @TrackActivity('User Logout', 'User')
  @ResponseMessage('Logged out successfully')
  @ApiOperation({ summary: 'Logout user' })
  logout() {
    return { success: true };
  }
}
