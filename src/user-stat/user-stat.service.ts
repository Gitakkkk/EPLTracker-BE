import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStat } from './entities/user-stat.entity';

@Injectable()
export class UserStatService {
  constructor(
    @InjectRepository(UserStat)
    private readonly userStatRepository: Repository<UserStat>,
  ) {}

  // 전체 누적 랭킹 (correctPicks 기준, 동률 시 totalPicks 적은 쪽 우선)
  async getRankings(limit = 50): Promise<UserStat[]> {
    return this.userStatRepository
      .createQueryBuilder('stat')
      .innerJoinAndSelect('stat.user', 'user')
      .where('stat.totalPicks > 0')
      .orderBy('stat.correctPicks', 'DESC')
      .addOrderBy('stat.totalPicks', 'ASC')
      .limit(limit)
      .getMany();
  }

  // 특정 라운드 랭킹 (해당 라운드에서의 적중 수 기준)
  async getRoundRankings(roundId: number, limit = 50) {
    return this.userStatRepository.manager
      .createQueryBuilder()
      .select('u.id', 'userId')
      .addSelect('u.nickname', 'nickname')
      .addSelect('u.profileImage', 'profileImage')
      .addSelect('COUNT(p.id)', 'totalPicks')
      .addSelect('SUM(CASE WHEN p."isCorrect" = true THEN 1 ELSE 0 END)', 'correctPicks')
      .from('picks', 'p')
      .innerJoin('users', 'u', 'u.id = p."userId"')
      .innerJoin('matches', 'm', 'm.id = p."matchId"')
      .innerJoin('rounds', 'r', 'r.id = m."roundId"')
      .where('r.id = :roundId', { roundId })
      .andWhere('p."isCorrect" IS NOT NULL')
      .groupBy('u.id')
      .orderBy('"correctPicks"', 'DESC')
      .addOrderBy('"totalPicks"', 'ASC')
      .limit(limit)
      .getRawMany();
  }
}
