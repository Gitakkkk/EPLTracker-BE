import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, OAuthProvider } from '../user/entities/user.entity';
import { Match, MatchResult, MatchStatus } from '../match/entities/match.entity';

const DUMMY_USER_COUNT = 10_000;
const TARGET_PICKS = 100_000;
const CHUNK = 1_000;
const PREDICTIONS = [MatchResult.HOME_WIN, MatchResult.DRAW, MatchResult.AWAY_WIN];

@Injectable()
export class DummyDataSeedService {
  private readonly logger = new Logger(DummyDataSeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
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

    for (let i = 0; i < DUMMY_USER_COUNT; i += CHUNK) {
      const end = Math.min(i + CHUNK, DUMMY_USER_COUNT);
      const valuePlaceholders = Array.from(
        { length: end - i },
        (_, k) => `($${k * 3 + 1}, $${k * 3 + 2}, $${k * 3 + 3})`,
      ).join(', ');
      const params: unknown[] = [];
      for (let j = i; j < end; j++) {
        params.push(OAuthProvider.KAKAO, `dummy_${j}`, `dummy_user_${j}`);
      }
      await this.dataSource.query(
        `INSERT INTO users (provider, "providerId", nickname) VALUES ${valuePlaceholders}`,
        params,
      );
    }
    this.logger.log(`    완료 (${Date.now() - t1}ms)`);

    // ── 2. UserStat 벌크 생성 ──────────────────────────────
    this.logger.log('[2/4] UserStat 생성 중...');
    const t2 = Date.now();

    // 방금 삽입한 더미 유저 ID 조회
    const dummyUsers: { id: number }[] = await this.dataSource.query(
      `SELECT id FROM users WHERE provider = $1 AND "providerId" LIKE 'dummy_%' ORDER BY id`,
      [OAuthProvider.KAKAO],
    );

    for (let i = 0; i < dummyUsers.length; i += CHUNK) {
      const chunk = dummyUsers.slice(i, i + CHUNK);
      const valuePlaceholders = chunk.map((_, k) => `($${k + 1})`).join(', ');
      const params = chunk.map((u) => u.id);
      await this.dataSource.query(
        `INSERT INTO user_stats ("userId") VALUES ${valuePlaceholders}`,
        params,
      );
    }
    this.logger.log(`    완료 (${Date.now() - t2}ms)`);

    // ── 3. 픽 100,000건 벌크 생성 ─────────────────────────
    this.logger.log('[3/4] 픽 생성 중...');
    const t3 = Date.now();

    const matches: { id: number; result: MatchResult | null }[] =
      await this.dataSource.query(
        `SELECT id, result FROM matches WHERE status = $1`,
        [MatchStatus.FINISHED],
      );

    if (matches.length === 0) {
      this.logger.error('FINISHED 경기가 없습니다. 먼저 `pnpm seed`를 실행하세요.');
      return;
    }

    const picksPerMatch = Math.ceil(TARGET_PICKS / matches.length);
    const N = dummyUsers.length;

    // (userId, matchId) 쌍 수집 후 청크 단위 insert
    let pickBatch: { userId: number; matchId: number; prediction: MatchResult; isCorrect: boolean | null }[] = [];
    let totalInserted = 0;

    const flushBatch = async () => {
      if (pickBatch.length === 0) return;
      const valuePlaceholders = pickBatch
        .map((_, k) => `($${k * 4 + 1}, $${k * 4 + 2}, $${k * 4 + 3}, $${k * 4 + 4})`)
        .join(', ');
      const params: unknown[] = pickBatch.flatMap((p) => [
        p.userId,
        p.matchId,
        p.prediction,
        p.isCorrect,
      ]);
      await this.dataSource.query(
        `INSERT INTO picks ("userId", "matchId", prediction, "isCorrect") VALUES ${valuePlaceholders}`,
        params,
      );
      totalInserted += pickBatch.length;
      pickBatch = [];
    };

    for (let mi = 0; mi < matches.length; mi++) {
      const match = matches[mi];
      const batchSize = Math.min(picksPerMatch, N);

      for (let j = 0; j < batchSize; j++) {
        const userIdx = (mi * picksPerMatch + j) % N;
        const prediction = PREDICTIONS[Math.floor(Math.random() * 3)];
        const isCorrect = match.result ? prediction === match.result : null;

        pickBatch.push({
          userId: dummyUsers[userIdx].id,
          matchId: match.id,
          prediction,
          isCorrect,
        });

        if (pickBatch.length >= CHUNK) await flushBatch();
      }
    }
    await flushBatch();

    this.logger.log(`    ${totalInserted.toLocaleString()}건 완료 (${Date.now() - t3}ms)`);

    // ── 4. UserStat 일괄 갱신 ─────────────────────────────
    this.logger.log('[4/4] UserStat 집계 반영 중...');
    const t4 = Date.now();

    await this.dataSource.query(`
      UPDATE user_stats us
      SET    "totalPicks"   = p.total,
             "correctPicks" = p.correct
      FROM (
        SELECT pk."userId",
               COUNT(*)                                                    AS total,
               SUM(CASE WHEN pk."isCorrect" = true THEN 1 ELSE 0 END)::int AS correct
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
      `✅ 더미 데이터 생성 완료 — 유저 ${dummyUsers.length.toLocaleString()}명, 픽 ${totalInserted.toLocaleString()}건`,
    );
  }
}
