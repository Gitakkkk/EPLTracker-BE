import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, OAuthProvider } from '../user/entities/user.entity';
import { UserStat } from '../user-stat/entities/user-stat.entity';
import { Match, MatchResult, MatchStatus } from '../match/entities/match.entity';
import { Pick } from '../pick/entities/pick.entity';

const DUMMY_USER_COUNT = 10_000;
const TARGET_PICKS = 100_000;
const CHUNK = 1_000;
const PREDICTIONS = [MatchResult.HOME_WIN, MatchResult.DRAW, MatchResult.AWAY_WIN];

@Injectable()
export class DummyDataSeedService {
  private readonly logger = new Logger(DummyDataSeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserStat) private readonly userStatRepo: Repository<UserStat>,
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
    @InjectRepository(Pick) private readonly pickRepo: Repository<Pick>,
    private readonly dataSource: DataSource,
  ) {}

  async run() {
    // 이미 실행됐으면 스킵
    const existing = await this.userRepo.findOne({
      where: { provider: OAuthProvider.KAKAO, providerId: 'dummy_0' },
    });
    if (existing) {
      this.logger.warn('더미 데이터가 이미 존재합니다. 스킵합니다.');
      return;
    }

    // ── 1. 유저 10,000명 벌크 생성 ─────────────────────────
    this.logger.log(`[1/4] 더미 유저 ${DUMMY_USER_COUNT.toLocaleString()}명 생성 중...`);
    const t1 = Date.now();

    const userRows = Array.from({ length: DUMMY_USER_COUNT }, (_, i) => ({
      provider: OAuthProvider.KAKAO,
      providerId: `dummy_${i}`,
      nickname: `dummy_user_${i}`,
    }));

    await this.bulkInsert(this.userRepo, userRows);
    this.logger.log(`    완료 (${Date.now() - t1}ms)`);

    // ── 2. UserStat 벌크 생성 ──────────────────────────────
    this.logger.log('[2/4] UserStat 생성 중...');
    const t2 = Date.now();

    const dummyUsers = await this.userRepo.find({
      where: { provider: OAuthProvider.KAKAO },
      select: { id: true, providerId: true },
      order: { id: 'ASC' },
    });
    const filteredUsers = dummyUsers.filter((u) => u.providerId.startsWith('dummy_'));

    const statRows = filteredUsers.map((u) => ({ userId: u.id }));
    await this.bulkInsert(this.userStatRepo, statRows);
    this.logger.log(`    완료 (${Date.now() - t2}ms)`);

    // ── 3. 픽 100,000건 벌크 생성 ─────────────────────────
    this.logger.log('[3/4] 픽 생성 중...');
    const t3 = Date.now();

    const matches = await this.matchRepo.find({
      where: { status: MatchStatus.FINISHED },
      select: { id: true, result: true },
    });
    if (matches.length === 0) {
      this.logger.error('FINISHED 경기가 없습니다. 먼저 `pnpm seed`를 실행하세요.');
      return;
    }

    const picksPerMatch = Math.ceil(TARGET_PICKS / matches.length);
    const N = filteredUsers.length;
    let totalInserted = 0;

    // 경기마다 round-robin으로 유저를 할당 → (userId, matchId) 중복 없음 보장
    // 수학적 근거: picksPerMatch(≈264) × matches.length(≈380) < N(10000)의 1/gcd 배수
    // → 380번 순환에서 같은 (matchId, userId) 쌍이 재등장하지 않음
    for (let mi = 0; mi < matches.length; mi++) {
      const match = matches[mi];
      const batchSize = Math.min(picksPerMatch, N);
      const pickRows: object[] = [];

      for (let j = 0; j < batchSize; j++) {
        const userIdx = (mi * picksPerMatch + j) % N;
        const user = filteredUsers[userIdx];
        const prediction = PREDICTIONS[Math.floor(Math.random() * 3)];
        const isCorrect = match.result ? prediction === match.result : null;

        pickRows.push({
          userId: user.id,
          matchId: match.id,
          prediction,
          isCorrect,
        });
      }

      await this.bulkInsert(this.pickRepo, pickRows);
      totalInserted += pickRows.length;
    }

    this.logger.log(`    ${totalInserted.toLocaleString()}건 완료 (${Date.now() - t3}ms)`);

    // ── 4. UserStat 일괄 갱신 (raw SQL) ───────────────────
    this.logger.log('[4/4] UserStat 집계 반영 중...');
    const t4 = Date.now();

    await this.dataSource.query(`
      UPDATE user_stats us
      SET    "totalPicks"   = p.total,
             "correctPicks" = p.correct
      FROM (
        SELECT pk."userId",
               COUNT(*)                                                AS total,
               SUM(CASE WHEN pk."isCorrect" = true THEN 1 ELSE 0 END) AS correct
        FROM   picks pk
        INNER  JOIN users u ON u.id = pk."userId"
        WHERE  u.provider = 'kakao'
          AND  u."providerId" LIKE 'dummy_%'
        GROUP  BY pk."userId"
      ) p
      WHERE us."userId" = p."userId"
    `);

    this.logger.log(`    완료 (${Date.now() - t4}ms)`);
    this.logger.log(
      `✅ 더미 데이터 생성 완료 — 유저 ${filteredUsers.length.toLocaleString()}명, 픽 ${totalInserted.toLocaleString()}건`,
    );
  }

  private async bulkInsert<T extends object>(
    repo: Repository<T>,
    rows: object[],
  ) {
    for (let i = 0; i < rows.length; i += CHUNK) {
      await repo.insert(rows.slice(i, i + CHUNK) as any);
    }
  }
}
