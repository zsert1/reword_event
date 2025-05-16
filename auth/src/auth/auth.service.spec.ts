/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from 'src/user/schemas/user.schema';
import { LoginHistory } from 'src/loginHistory/schemas/loginHistory.schema';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let historyModel: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      prototype: {
        save: jest.fn(),
      },
    };
    historyModel = {
      create: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: getModelToken(LoginHistory.name),
          useValue: historyModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signup', () => {
    it('존재하지 않으면 새 사용자 생성', async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue({ username: 'test' });

      const result = await service.signup('test', 'pass');
      expect(result.username).toBe('test');
    });

    it('사용자가 존재하는 경우 ConflictException을 throw해야 합니다', async () => {
      userModel.findOne.mockResolvedValue({ username: 'test' });

      await expect(service.signup('test', 'pass')).rejects.toThrow(
        '이미 존재하는 유저명입니다.',
      );
    });
  });

  describe('login', () => {
    it('로그인 성공 시 토큰을 반환해야 합니다.', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      userModel.findOne.mockResolvedValue({
        _id: 'user123',
        username: 'test',
        password: hashed,
        role: 'USER',
      });

      jest.spyOn(jwtService, 'sign').mockReturnValue('mock.jwt.token');

      const result = await service.login('test', 'pass', {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest-agent' },
      } as any);

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(historyModel.create).toHaveBeenCalledWith({
        userId: 'user123',
        ip: '127.0.0.1',
        userAgent: 'jest-agent',
      });
    });

    it('사용자를 찾을 수 없는 경우 UnauthorizedException을 throw해야 합니다', async () => {
      userModel.findOne.mockResolvedValue(null);
      await expect(service.login('no', 'pass', {} as any)).rejects.toThrow(
        '올바른 정보가 아닙니다.',
      );
    });

    it('비밀번호가 일치하지 않으면 UnauthorizedException을 throw해야 합니다', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      userModel.findOne.mockResolvedValue({
        _id: 'user123',
        username: 'test',
        password: hashed,
        role: 'USER',
      });

      await expect(
        service.login('test', 'wrongpass', {} as any),
      ).rejects.toThrow('올바른 정보가 아닙니다.');
    });
  });
});
