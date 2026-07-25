import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Round } from '../../round/entities/round.entity';
import { Pick } from '../../pick/entities/pick.entity';

export enum MatchStatus {
  SCHEDULED = 'scheduled',     // 경기 예정
  IN_PROGRESS = 'in_progress', // 경기 중
  FINISHED = 'finished',       // 종료
}

export enum MatchResult {
  HOME_WIN = 'home_win',
  DRAW = 'draw',
  AWAY_WIN = 'away_win',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  homeTeam: string;

  @Column()
  awayTeam: string;

  @Column({ type: 'timestamptz' })
  startTime: Date; // 픽 마감 기준 시각

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status: MatchStatus;

  @Column({ nullable: true })
  homeScore: number;

  @Column({ nullable: true })
  awayScore: number;

  // 경기 결과 확정 후 세팅 → Pick.isCorrect 계산에 사용
  @Column({ type: 'enum', enum: MatchResult, nullable: true })
  result: MatchResult;

  @ManyToOne(() => Round, (round) => round.matches, { onDelete: 'CASCADE' })
  round: Round;

  @OneToMany(() => Pick, (pick) => pick.match)
  picks: Pick[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
