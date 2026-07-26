import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PickService } from './pick.service';
import { Pick } from './entities/pick.entity';
import { UserStat } from '../user-stat/entities/user-stat.entity';
import { MatchService } from '../match/match.service';
import { MatchResult, MatchStatus } from '../match/entities/match.entity';
import { User } from '../user/entities/user.entity';
import { CreatePickDto } from './dto/create-pick.dto';

const mockPickRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockUserStatRepository = () => ({
  increment: jest.fn(),
});

const mockMatchService = () => ({
  findOne: jest.fn(),
});

describe('PickService', () => {
  let service: PickService;
  let pickRepo: ReturnType<typeof mockPickRepository>;
  let userStatRepo: ReturnType<typeof mockUserStatRepository>;
  let matchService: ReturnType<typeof mockMatchService>;

  const user = { id: 1 } as User;
  const dto: CreatePickDto = { matchId: 1, prediction: MatchResult.HOME_WIN };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PickService,
        { provide: getRepositoryToken(Pick), useFactory: mockPickRepository },
        { provide: getRepositoryToken(UserStat), useFactory: mockUserStatRepository },
        { provide: MatchService, useFactory: mockMatchService },
      ],
    }).compile();

    service = module.get(PickService);
    pickRepo = module.get(getRepositoryToken(Pick));
    userStatRepo = module.get(getRepositoryToken(UserStat));
    matchService = module.get(MatchService);
  });

  describe('create', () => {
    it('경기가 SCHEDULED 상태가 아니면 BadRequestException을 던진다', async () => {
      matchService.findOne.mockResolvedValue({
        id: 1,
        status: MatchStatus.IN_PROGRESS,
        startTime: new Date(Date.now() + 60_000),
      });

      await expect(service.create(user, dto)).rejects.toThrow(BadRequestException);
    });

    it('경기 startTime이 지났으면 BadRequestException을 던진다', async () => {
      matchService.findOne.mockResolvedValue({
        id: 1,
        status: MatchStatus.SCHEDULED,
        startTime: new Date(Date.now() - 1_000),
      });

      await expect(service.create(user, dto)).rejects.toThrow(BadRequestException);
    });

    it('같은 경기에 이미 픽이 있으면 ConflictException을 던진다', async () => {
      matchService.findOne.mockResolvedValue({
        id: 1,
        status: MatchStatus.SCHEDULED,
        startTime: new Date(Date.now() + 60_000),
      });
      pickRepo.findOne.mockResolvedValue({ id: 99 } as Pick);

      await expect(service.create(user, dto)).rejects.toThrow(ConflictException);
    });

    it('정상 제출 시 픽을 저장하고 totalPicks를 증가시킨다', async () => {
      const match = { id: 1, status: MatchStatus.SCHEDULED, startTime: new Date(Date.now() + 60_000) };
      matchService.findOne.mockResolvedValue(match);
      pickRepo.findOne.mockResolvedValue(null);

      const created = { id: 10, prediction: MatchResult.HOME_WIN } as Pick;
      pickRepo.create.mockReturnValue(created);
      pickRepo.save.mockResolvedValue(created);
      userStatRepo.increment.mockResolvedValue(undefined);

      const result = await service.create(user, dto);

      expect(pickRepo.save).toHaveBeenCalledWith(created);
      expect(userStatRepo.increment).toHaveBeenCalledWith(
        { user: { id: user.id } },
        'totalPicks',
        1,
      );
      expect(result).toBe(created);
    });
  });
});
