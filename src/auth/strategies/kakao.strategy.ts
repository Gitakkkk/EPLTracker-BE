import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { UserService } from '../../user/user.service';
import { OAuthProvider } from '../../user/entities/user.entity';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: config.getOrThrow('KAKAO_CLIENT_ID'),
      clientSecret: config.getOrThrow('KAKAO_CLIENT_SECRET'),
      callbackURL: config.getOrThrow('KAKAO_CALLBACK_URL'),
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ) {
    return this.userService.findOrCreate({
      provider: OAuthProvider.KAKAO,
      providerId: String(profile.id),
      nickname: profile.displayName ?? profile.username,
      email: profile._json?.kakao_account?.email,
      profileImage: profile._json?.properties?.profile_image,
    });
  }
}
