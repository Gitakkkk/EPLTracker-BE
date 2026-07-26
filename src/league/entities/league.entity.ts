import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Round } from '../../round/entities/round.entity';

@Entity('leagues')
export class League {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g. "Premier League"

  @Column()
  season: string; // e.g. "2024-25"

  @OneToMany(() => Round, (round) => round.league)
  rounds: Round[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
