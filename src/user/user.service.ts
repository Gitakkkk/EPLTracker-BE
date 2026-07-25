import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, OAuthProvider } from './entities/user.entity';
import { UserStat } from '../user-stat/entities/user-stat.entity';

interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  nickname: string;
  email?: string;
  profileImage?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserStat)
    private readonly userStatRepository: Repository<UserStat>,
  ) {}

  async findOrCreate(profile: OAuthProfile): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { provider: profile.provider, providerId: profile.providerId },
    });

    if (existing) return existing;

    const user = this.userRepository.create({
      provider: profile.provider,
      providerId: profile.providerId,
      nickname: profile.nickname,
      email: profile.email,
      profileImage: profile.profileImage,
    });

    await this.userRepository.save(user);

    // 최초 가입 시 UserStat 생성
    const stat = this.userStatRepository.create({ user });
    await this.userStatRepository.save(stat);

    return user;
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
