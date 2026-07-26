import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { League } from '../../league/entities/league.entity';
import { Match } from '../../match/entities/match.entity';

export enum RoundStatus {
  UPCOMING = 'upcoming',   // 픽 제출 가능
  IN_PROGRESS = 'in_progress', // 경기 진행 중
  FINISHED = 'finished',   // 라운드 종료, 결과 확정
}

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  number: number; // 게임위크 번호 (1~38)

  @Column({ type: 'enum', enum: RoundStatus, default: RoundStatus.UPCOMING })
  status: RoundStatus;

  @ManyToOne(() => League, (league) => league.rounds, { onDelete: 'CASCADE' })
  league: League;

  @OneToMany(() => Match, (match) => match.round)
  matches: Match[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
