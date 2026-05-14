import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { TrackActivity } from '../common/decorators/track-activity.decorator';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Admin Auth')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for admin auth
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @TrackActivity('Admin Login', 'Admin')
  @ResponseMessage('Admin login successful')
  @ApiOperation({ summary: 'Login for Admin users' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.adminLogin(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @TrackActivity('Admin Logout', 'Admin')
  @ResponseMessage('Logged out successfully')
  @ApiOperation({ summary: 'Logout admin' })
  logout() {
    return { success: true };
  }
}
