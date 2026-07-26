import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('user_stats')
@Index('idx_user_stats_ranking', ['correctPicks', 'totalPicks'])
export class UserStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  totalPicks: number;

  @Column({ default: 0 })
  correctPicks: number;

  // 정확도(%) = correctPicks / totalPicks * 100
  // 랭킹 정렬 기준은 correctPicks (적중 수)로 먼저, 동률 시 totalPicks 적은 쪽 우선
  @OneToOne(() => User, (user) => user.stat, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
