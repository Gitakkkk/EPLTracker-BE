import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStat } from './entities/user-stat.entity';
import { UserStatService } from './user-stat.service';
import { UserStatController } from './user-stat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserStat])],
  controllers: [UserStatController],
  providers: [UserStatService],
})
export class UserStatModule {}
