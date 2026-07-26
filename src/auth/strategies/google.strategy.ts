import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UserService } from '../../user/user.service';
import { OAuthProvider } from '../../user/entities/user.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: config.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const user = await this.userService.findOrCreate({
      provider: OAuthProvider.GOOGLE,
      providerId: profile.id,
      nickname: profile.displayName,
      email: profile.emails?.[0]?.value,
      profileImage: profile.photos?.[0]?.value,
    });
    done(null, user);
  }
}
