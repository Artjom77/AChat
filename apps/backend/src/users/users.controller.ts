import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto, UpdateAiPreferencesDto } from './dto/user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@Req() req: any) {
    return req.user;
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateCurrentUser(@Req() req: any, @Body() updateDto: UpdateUserDto) {
    return await this.usersService.update(req.user.id, updateDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  async searchUsers(@Query('q') query: string) {
    return await this.usersService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Put('me/ai-preferences')
  @ApiOperation({ summary: 'Update AI preferences' })
  async updateAiPreferences(
    @Req() req: any,
    @Body() preferences: UpdateAiPreferencesDto,
  ) {
    return await this.usersService.updateAiPreferences(
      req.user.id,
      preferences,
    );
  }

  @Put('me/public-key')
  @ApiOperation({ summary: 'Update public key for E2E encryption' })
  async updatePublicKey(@Req() req: any, @Body() body: { publicKey: string }) {
    return await this.usersService.updatePublicKey(req.user.id, body.publicKey);
  }
}
