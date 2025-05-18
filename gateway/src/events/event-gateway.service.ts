import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventGatewayService {
  constructor(private readonly httpService: HttpService) {}

  async getUserIdsByRole(role: string): Promise<string[]> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<string[]>(`http://auth:3001/auth/users/${role}`),
      );
      return data;
    } catch (error) {
      console.error('❌ Auth 서버에서 userIds 가져오기 실패:', error.message);
      throw new InternalServerErrorException('유저 목록 조회 실패');
    }
  }
}
