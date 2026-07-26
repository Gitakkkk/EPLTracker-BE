import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchResult, MatchStatus } from './entities/match.entity';
import { Pick } from '../pick/entities/pick.entity';
import { UserStat } from '../user-stat/entities/user-stat.entity';
import { RoundService } from '../round/round.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateResultDto } from './dto/update-result.dto';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly roundService: RoundService,
  ) {}

  async create(roundId: number, dto: CreateMatchDto): Promise<Match> {
    const round = await this.roundService.findOne(roundId);
    return this.matchRepository.save(
      this.matchRepository.create({ ...dto, round }),
    );
  }

  findByRound(roundId: number): Promise<Match[]> {
    return this.matchRepository.find({
      where: { round: { id: roundId } },
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Match> {
    const match = await this.matchRepository.findOne({ where: { id } });
    if (!match) throw new NotFoundException(`Match #${id} not found`);
    return match;
  }

  async updateResult(id: number, dto: UpdateResultDto): Promise<Match> {
    const match = await this.findOne(id);

    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException('이미 결과가 입력된 경기입니다.');
    }

    match.homeScore = dto.homeScore;
    match.awayScore = dto.awayScore;
    match.status = MatchStatus.FINISHED;
    match.result = this.calcResult(dto.homeScore, dto.awayScore);

    await this.matchRepository.manager.transaction(async (em) => {
      await em.save(match);

      const picks = await em.find(Pick, {
        where: { match: { id } },
        relations: { user: true },
      });

      for (const pick of picks) {
        pick.isCorrect = pick.prediction === match.result;
      }

      await em.save(Pick, picks);

      const correctUserIds = picks
        .filter((p) => p.isCorrect)
        .map((p) => p.user.id);

      for (const userId of correctUserIds) {
        await em.increment(UserStat, { user: { id: userId } }, 'correctPicks', 1);
      }
    });

    return match;
  }

  private calcResult(home: number, away: number): MatchResult {
    if (home > away) return MatchResult.HOME_WIN;
    if (home < away) return MatchResult.AWAY_WIN;
    return MatchResult.DRAW;
  }
}
