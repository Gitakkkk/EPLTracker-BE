import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { League } from './entities/league.entity';
import { CreateLeagueDto } from './dto/create-league.dto';

@Injectable()
export class LeagueService {
  constructor(
    @InjectRepository(League)
    private readonly leagueRepository: Repository<League>,
  ) {}

  create(dto: CreateLeagueDto): Promise<League> {
    return this.leagueRepository.save(this.leagueRepository.create(dto));
  }

  findAll(): Promise<League[]> {
    return this.leagueRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<League> {
    const league = await this.leagueRepository.findOne({ where: { id } });
    if (!league) throw new NotFoundException(`League #${id} not found`);
    return league;
  }
}
