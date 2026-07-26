import { MatchResult } from '../../match/entities/match.entity';

export class CreatePickDto {
  matchId: number;
  prediction: MatchResult; // 'home_win' | 'draw' | 'away_win'
}
