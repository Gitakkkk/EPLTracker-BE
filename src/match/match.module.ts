import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Pick } from '../pick/entities/pick.entity';
import { UserStat } from '../user-stat/entities/user-stat.entity';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { RoundModule } from '../round/round.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Pick, UserStat]), RoundModule],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
