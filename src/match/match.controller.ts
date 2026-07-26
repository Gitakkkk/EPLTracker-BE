import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateResultDto } from './dto/update-result.dto';

@Controller('rounds/:roundId/matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  create(@Param('roundId') roundId: string, @Body() dto: CreateMatchDto) {
    return this.matchService.create(+roundId, dto);
  }

  @Get()
  findAll(@Param('roundId') roundId: string) {
    return this.matchService.findByRound(+roundId);
  }

  @Patch(':id/result')
  updateResult(@Param('id') id: string, @Body() dto: UpdateResultDto) {
    return this.matchService.updateResult(+id, dto);
  }
}
