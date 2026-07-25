import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeagueService } from '../league/league.service';
import { RoundService } from '../round/round.service';
import { MatchService } from '../match/match.service';
import { MatchResult, MatchStatus } from '../match/entities/match.entity';
import { RoundStatus } from '../round/entities/round.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from '../round/entities/round.entity';
import { Match } from '../match/entities/match.entity';

const API_BASE = 'https://api.football-data.org/v4';

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: { shortName: string };
  awayTeam: { shortName: string };
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    fullTime: { home: number | null; away: number | null };
  };
}

@Injectable()
export class FootballDataSeedService {
  private readonly logger = new Logger(FootballDataSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly leagueService: LeagueService,
    private readonly roundService: RoundService,
    private readonly matchService: MatchService,
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  async run() {
    const apiKey = this.configService.getOrThrow('FOOTBALL_DATA_API_KEY');

    this.logger.log('football-data.org에서 2024-25 시즌 데이터를 가져옵니다...');

    const res = await fetch(`${API_BASE}/competitions/PL/matches?season=2024`, {
      headers: { 'X-Auth-Token': apiKey },
    });

    if (!res.ok) {
      throw new Error(`API 호출 실패: ${res.status} ${res.statusText}`);
    }

    const data = await res.json() as { matches: FdMatch[] };
    const fdMatches = data.matches;

    this.logger.log(`총 ${fdMatches.length}경기 수신`);

    // 1. 리그 생성 (이미 있으면 재사용)
    const leagues = await this.leagueService.findAll();
    let league = leagues.find((l) => l.name === 'Premier League' && l.season === '2024-25');
    if (!league) {
      league = await this.leagueService.create({ name: 'Premier League', season: '2024-25' });
      this.logger.log(`리그 생성: ${league.name} ${league.season}`);
    } else {
      this.logger.log(`기존 리그 사용: ${league.name} ${league.season}`);
    }

    // 2. matchday별로 그룹화
    const matchdayMap = new Map<number, FdMatch[]>();
    for (const m of fdMatches) {
      if (!matchdayMap.has(m.matchday)) matchdayMap.set(m.matchday, []);
      matchdayMap.get(m.matchday)!.push(m);
    }

    // 3. 라운드 & 경기 생성
    const sortedMatchdays = [...matchdayMap.keys()].sort((a, b) => a - b);

    for (const matchday of sortedMatchdays) {
      // 라운드 생성 (이미 있으면 건너뜀)
      const existingRounds = await this.roundService.findByLeague(league.id);
      let round = existingRounds.find((r) => r.number === matchday);

      if (!round) {
        round = await this.roundService.create(league.id, { number: matchday });
      }

      // 라운드 status 계산 (해당 matchday 경기들 기준)
      const mdMatches = matchdayMap.get(matchday)!;
      const allFinished = mdMatches.every((m) => m.status === 'FINISHED');
      const anyInPlay = mdMatches.some((m) => ['IN_PLAY', 'PAUSED'].includes(m.status));

      round.status = allFinished
        ? RoundStatus.FINISHED
        : anyInPlay
          ? RoundStatus.IN_PROGRESS
          : RoundStatus.UPCOMING;
      await this.roundRepository.save(round);

      // 경기 생성
      let created = 0;
      for (const fdMatch of mdMatches) {
        const existing = await this.matchRepository.findOne({
          where: { round: { id: round.id }, homeTeam: fdMatch.homeTeam.shortName },
        });
        if (existing) continue;

        const status = this.mapStatus(fdMatch.status);
        const result = this.mapResult(fdMatch.score.winner);

        const match = this.matchRepository.create({
          homeTeam: fdMatch.homeTeam.shortName,
          awayTeam: fdMatch.awayTeam.shortName,
          startTime: new Date(fdMatch.utcDate),
          status,
          homeScore: fdMatch.score.fullTime.home ?? undefined,
          awayScore: fdMatch.score.fullTime.away ?? undefined,
          result,
          round,
        });
        await this.matchRepository.save(match);
        created++;
      }

      this.logger.log(`GW${matchday}: ${created}경기 생성 (status: ${round.status})`);
    }

    this.logger.log('시드 완료!');
  }

  private mapStatus(status: string): MatchStatus {
    if (status === 'FINISHED') return MatchStatus.FINISHED;
    if (['IN_PLAY', 'PAUSED'].includes(status)) return MatchStatus.IN_PROGRESS;
    return MatchStatus.SCHEDULED;
  }

  private mapResult(winner: string | null): MatchResult | undefined {
    if (winner === 'HOME_TEAM') return MatchResult.HOME_WIN;
    if (winner === 'AWAY_TEAM') return MatchResult.AWAY_WIN;
    if (winner === 'DRAW') return MatchResult.DRAW;
    return undefined;
  }
}
