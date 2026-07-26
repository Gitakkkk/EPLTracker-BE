import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { MatchService } from './match.service';
import { Match, MatchResult, MatchStatus } from './entities/match.entity';
import { Pick } from '../pick/entities/pick.entity';
import { UserStat } from '../user-stat/entities/user-stat.entity';
import { RoundService } from '../round/round.service';
import { UpdateResultDto } from './dto/update-result.dto';

describe('MatchService', () => {
  let service: MatchService;

  // EntityManager mock — transaction()이 콜백을 즉시 실행
  const managerMock = {
    save: jest.fn(),
    find: jest.fn(),
    increment: jest.fn(),
  };

  const mockMatchRepository = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    manager: {
      transaction: jest.fn((cb: (em: typeof managerMock) => Promise<void>) =>
        cb(managerMock),
      ),
    },
  });

  let matchRepo: ReturnType<typeof mockMatchRepository>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        { provide: getRepositoryToken(Match), useFactory: mockMatchRepository },
        { provide: RoundService, useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get(MatchService);
    matchRepo = module.get(getRepositoryToken(Match));
  });

  describe('updateResult', () => {
    it('이미 FINISHED 상태인 경기에 결과를 입력하면 BadRequestException을 던진다', async () => {
      matchRepo.findOne.mockResolvedValue({
        id: 1,
        status: MatchStatus.FINISHED,
      } as Match);

      const dto: UpdateResultDto = { homeScore: 2, awayScore: 1 };
      await expect(service.updateResult(1, dto)).rejects.toThrow(BadRequestException);
    });

    it('홈 점수가 높으면 result를 HOME_WIN으로 설정한다', async () => {
      matchRepo.findOne.mockResolvedValue({
        id: 1,
        status: MatchStatus.SCHEDULED,
      } as Match);
      managerMock.find.mockResolvedValue([]);

      const result = await service.updateResult(1, { homeScore: 3, awayScore: 1 });

      expect(result.result).toBe(MatchResult.HOME_WIN);
      expect(result.status).toBe(MatchStatus.FINISHED);
    });

    it('원정 점수가 높으면 result를 AWAY_WIN으로 설정한다', async () => {
      matchRepo.findOne.mockResolvedValue({
        id: 1,
        status: MatchStatus.SCHEDULED,
      } as Match);
      managerMock.find.mockResolvedValue([]);

      const result = await service.updateResult(1, { homeScore: 0, awayScore: 2 });

      expect(result.result).toBe(MatchResult.AWAY_WIN);
    });

    it('동점이면 result를 DRAW로 설정한다', async () => {
      matchRepo.findOne.mockResolvedValue({
        id: 1,
        status: MatchStatus.SCHEDULED,
      } as Match);
      managerMock.find.mockResolvedValue([]);

      const result = await service.updateResult(1, { homeScore: 1, awayScore: 1 });

      expect(result.result).toBe(MatchResult.DRAW);
    });

    it('적중한 픽의 유저 correctPicks를 증가시키고, 틀린 픽은 증가시키지 않는다', async () => {
      matchRepo.findOne.mockResolvedValue({
        id: 1,
        status: MatchStatus.SCHEDULED,
      } as Match);

      const picks = [
        { id: 1, prediction: MatchResult.HOME_WIN, user: { id: 10 } },
        { id: 2, prediction: MatchResult.DRAW, user: { id: 20 } },
      ] as Pick[];
      managerMock.find.mockResolvedValue(picks);
      managerMock.save.mockResolvedValue(undefined);

      await service.updateResult(1, { homeScore: 2, awayScore: 0 }); // HOME_WIN

      expect(managerMock.increment).toHaveBeenCalledTimes(1);
      expect(managerMock.increment).toHaveBeenCalledWith(
        UserStat,
        { user: { id: 10 } },
        'correctPicks',
        1,
      );
    });
  });
});
