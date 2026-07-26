import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  login(user: User): { accessToken: string } {
    const payload: JwtPayload = { sub: user.id, nickname: user.nickname };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
