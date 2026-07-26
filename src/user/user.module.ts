import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserStat } from '../user-stat/entities/user-stat.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserStat])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
