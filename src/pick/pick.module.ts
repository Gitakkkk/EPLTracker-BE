import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pick } from './entities/pick.entity';
import { PickService } from './pick.service';
import { PickController } from './pick.controller';
import { MatchModule } from '../match/match.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pick]), MatchModule],
  controllers: [PickController],
  providers: [PickService],
  exports: [PickService],
})
export class PickModule {}
