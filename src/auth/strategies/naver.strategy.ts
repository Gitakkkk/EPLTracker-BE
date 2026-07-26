import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver-v2';
import { UserService } from '../../user/user.service';
import { OAuthProvider, User } from '../../user/entities/user.entity';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: config.getOrThrow('NAVER_CLIENT_ID'),
      clientSecret: config.getOrThrow('NAVER_CLIENT_SECRET'),
      callbackURL: config.getOrThrow('NAVER_CALLBACK_URL'),
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<User> {
    const res = profile._json?.response;
    const nickname =
      res?.nickname ?? res?.name ?? profile.displayName ?? String(profile.id);

    return this.userService.findOrCreate({
      provider: OAuthProvider.NAVER,
      providerId: String(profile.id),
      nickname,
      email: res?.email ?? profile.email,
      profileImage: res?.profile_image ?? profile.profileImage,
    });
  }
}
