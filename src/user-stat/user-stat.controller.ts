import { Controller, Get, Query } from '@nestjs/common';
import { UserStatService } from './user-stat.service';

@Controller('rankings')
export class UserStatController {
  constructor(private readonly userStatService: UserStatService) {}

  // 전체 누적 랭킹
  @Get()
  getRankings() {
    return this.userStatService.getRankings();
  }

  // 라운드별 랭킹
  @Get('round')
  getRoundRankings(@Query('roundId') roundId: string) {
    return this.userStatService.getRoundRankings(+roundId);
  }
}
