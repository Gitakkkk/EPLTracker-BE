import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { League } from '../league/entities/league.entity';
import { Round } from '../round/entities/round.entity';
import { Match } from '../match/entities/match.entity';
import { Pick } from '../pick/entities/pick.entity';
import { UserStat } from '../user-stat/entities/user-stat.entity';
import { LeagueModule } from '../league/league.module';
import { RoundModule } from '../round/round.module';
import { MatchModule } from '../match/match.module';
import { FootballDataSeedService } from './football-data-seed.service';
import { TypeOrmModule as TypeOrmFeature } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [User, League, Round, Match, Pick, UserStat],
        synchronize: true,
      }),
    }),
    TypeOrmFeature.forFeature([Round, Match]),
    LeagueModule,
    RoundModule,
    MatchModule,
  ],
  providers: [FootballDataSeedService],
})
export class SeedModule {}
