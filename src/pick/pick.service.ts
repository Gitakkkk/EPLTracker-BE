import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pick } from './entities/pick.entity';
import { MatchService } from '../match/match.service';
import { MatchStatus } from '../match/entities/match.entity';
import { User } from '../user/entities/user.entity';
import { CreatePickDto } from './dto/create-pick.dto';

@Injectable()
export class PickService {
  constructor(
    @InjectRepository(Pick)
    private readonly pickRepository: Repository<Pick>,
    private readonly matchService: MatchService,
  ) {}

  async create(user: User, dto: CreatePickDto): Promise<Pick> {
    const match = await this.matchService.findOne(dto.matchId);

    // 경기가 이미 시작됐거나 종료된 경우 픽 불가
    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('이미 시작되었거나 종료된 경기에는 픽을 제출할 수 없습니다.');
    }

    // 경기 시작 시각이 지난 경우 픽 불가 (status가 아직 갱신 안 됐을 경우 대비)
    if (new Date() >= match.startTime) {
      throw new BadRequestException('경기 시작 시각이 지나 픽을 제출할 수 없습니다.');
    }

    // 중복 픽 확인
    const existing = await this.pickRepository.findOne({
      where: { user: { id: user.id }, match: { id: match.id } },
    });
    if (existing) {
      throw new ConflictException('이미 해당 경기에 픽을 제출했습니다.');
    }

    const pick = this.pickRepository.create({
      user,
      match,
      prediction: dto.prediction,
    });

    return this.pickRepository.save(pick);
  }

  async findMyPicks(user: User, roundId?: number): Promise<Pick[]> {
    const qb = this.pickRepository
      .createQueryBuilder('pick')
      .innerJoinAndSelect('pick.match', 'match')
      .innerJoinAndSelect('match.round', 'round')
      .where('pick.user.id = :userId', { userId: user.id });

    if (roundId) {
      qb.andWhere('round.id = :roundId', { roundId });
    }

    return qb.orderBy('match.startTime', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Pick> {
    const pick = await this.pickRepository.findOne({
      where: { id },
      relations: { user: true, match: true },
    });
    if (!pick) throw new NotFoundException(`Pick #${id} not found`);
    return pick;
  }
}
