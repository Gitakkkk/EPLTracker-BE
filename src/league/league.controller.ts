import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LeagueService } from './league.service';
import { CreateLeagueDto } from './dto/create-league.dto';

@Controller('leagues')
export class LeagueController {
  constructor(private readonly leagueService: LeagueService) {}

  @Post()
  create(@Body() dto: CreateLeagueDto) {
    return this.leagueService.create(dto);
  }

  @Get()
  findAll() {
    return this.leagueService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leagueService.findOne(+id);
  }
}
