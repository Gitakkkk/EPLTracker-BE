import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from './entities/round.entity';
import { LeagueService } from '../league/league.service';
import { CreateRoundDto } from './dto/create-round.dto';

@Injectable()
export class RoundService {
  constructor(
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    private readonly leagueService: LeagueService,
  ) {}

  async create(leagueId: number, dto: CreateRoundDto): Promise<Round> {
    const league = await this.leagueService.findOne(leagueId);
    return this.roundRepository.save(
      this.roundRepository.create({ ...dto, league }),
    );
  }

  findByLeague(leagueId: number): Promise<Round[]> {
    return this.roundRepository.find({
      where: { league: { id: leagueId } },
      order: { number: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Round> {
    const round = await this.roundRepository.findOne({
      where: { id },
      relations: { league: true },
    });
    if (!round) throw new NotFoundException(`Round #${id} not found`);
    return round;
  }
}
