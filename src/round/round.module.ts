import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from './entities/round.entity';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';
import { LeagueModule } from '../league/league.module';

@Module({
  imports: [TypeOrmModule.forFeature([Round]), LeagueModule],
  controllers: [RoundController],
  providers: [RoundService],
  exports: [RoundService],
})
export class RoundModule {}
