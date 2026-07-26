import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserStat } from '../user-stat/entities/user-stat.entity';
import { League } from '../league/entities/league.entity';
import { Round } from '../round/entities/round.entity';
import { Match } from '../match/entities/match.entity';
import { Pick } from '../pick/entities/pick.entity';
import { DummyDataSeedService } from './dummy-data-seed.service';

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
        entities: [User, UserStat, League, Round, Match, Pick],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([User, Match]),
  ],
  providers: [DummyDataSeedService],
})
class DummyDataSeedModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DummyDataSeedModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    await app.get(DummyDataSeedService).run();
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
