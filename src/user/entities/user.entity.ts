import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Pick } from '../../pick/entities/pick.entity';
import { UserStat } from '../../user-stat/entities/user-stat.entity';

export enum OAuthProvider {
  KAKAO = 'kakao',
  NAVER = 'naver',
  GOOGLE = 'google',
}

@Entity('users')
@Unique(['provider', 'providerId'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: OAuthProvider })
  provider: OAuthProvider;

  @Column()
  providerId: string;

  @Column({ unique: true })
  nickname: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  profileImage: string;

  @OneToMany(() => Pick, (pick) => pick.user)
  picks: Pick[];

  @OneToOne(() => UserStat, (stat) => stat.user)
  stat: UserStat;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
