import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { KakaoAuthGuard } from './guards/kakao-auth.guard';
import { NaverAuthGuard } from './guards/naver-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── 카카오 ──────────────────────────────────────
  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  kakaoLogin() {
    // 카카오 OAuth 페이지로 리다이렉트 (Passport가 처리)
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  kakaoCallback(@Req() req: { user: User }) {
    return this.authService.login(req.user);
  }

  // ── 네이버 ──────────────────────────────────────
  @Get('naver')
  @UseGuards(NaverAuthGuard)
  naverLogin() {}

  @Get('naver/callback')
  @UseGuards(NaverAuthGuard)
  naverCallback(@Req() req: { user: User }) {
    return this.authService.login(req.user);
  }

  // ── 구글 ────────────────────────────────────────
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: { user: User }) {
    return this.authService.login(req.user);
  }

  // ── 내 정보 확인 (JWT 필요) ──────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      profileImage: user.profileImage,
      provider: user.provider,
    };
  }
}
