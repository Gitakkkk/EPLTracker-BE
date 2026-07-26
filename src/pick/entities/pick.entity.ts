import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Match } from '../../match/entities/match.entity';
import { MatchResult } from '../../match/entities/match.entity';

@Entity('picks')
@Unique(['user', 'match']) // 한 유저가 같은 경기에 픽을 중복 제출 불가
export class Pick {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: MatchResult })
  prediction: MatchResult; // HOME_WIN | DRAW | AWAY_WIN

  // 경기 결과 확정 전: null / 확정 후: true or false
  @Column({ nullable: true })
  isCorrect: boolean;

  @ManyToOne(() => User, (user) => user.picks, { onDelete: 'CASCADE' })
  user: User;

  // 라운드별 랭킹 쿼리에서 matchId 기준 JOIN 시 풀스캔 방지
  @Index('idx_picks_match_id')
  @ManyToOne(() => Match, (match) => match.picks, { onDelete: 'CASCADE' })
  match: Match;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
