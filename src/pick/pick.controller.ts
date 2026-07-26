import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PickService } from './pick.service';
import { CreatePickDto } from './dto/create-pick.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('picks')
@UseGuards(JwtAuthGuard)
export class PickController {
  constructor(private readonly pickService: PickService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreatePickDto) {
    return this.pickService.create(user, dto);
  }

  @Get('me')
  findMyPicks(
    @CurrentUser() user: User,
    @Query('roundId') roundId?: string,
  ) {
    return this.pickService.findMyPicks(user, roundId ? +roundId : undefined);
  }
}
