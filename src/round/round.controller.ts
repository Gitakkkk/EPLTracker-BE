import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RoundService } from './round.service';
import { CreateRoundDto } from './dto/create-round.dto';

@Controller('leagues/:leagueId/rounds')
export class RoundController {
  constructor(private readonly roundService: RoundService) {}

  @Post()
  create(@Param('leagueId') leagueId: string, @Body() dto: CreateRoundDto) {
    return this.roundService.create(+leagueId, dto);
  }

  @Get()
  findAll(@Param('leagueId') leagueId: string) {
    return this.roundService.findByLeague(+leagueId);
  }
}
