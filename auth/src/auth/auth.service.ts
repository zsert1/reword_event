import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Role, User, UserDocument } from '../user/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  LoginHistory,
  LoginHistoryDocument,
} from 'src/loginHistory/schemas/loginHistory.schema';
import { Request } from 'express';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(LoginHistory.name)
    private loginHistoryModel: Model<LoginHistoryDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(username: string, password: string) {
    const existing = await this.userModel.findOne({ username });
    if (existing) throw new ConflictException('이미 존재하는 유저명입니다.');
    const hashed = await bcrypt.hash(password, 10);
    return this.userModel.create({ username, password: hashed });
  }

  async login(username: string, password: string, req: Request) {
    const user = await this.userModel.findOne({ username });
    if (!user) throw new UnauthorizedException('올바른 정보가 아닙니다.');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('올바른 정보가 아닙니다.');
    await this.loginHistoryModel.create({
      userId: user._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    const payload = {
      sub: user._id,
      username: user.username,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
  // 관리자 계정 생성
  async createAdmin(username: string, password: string) {
    const existing = await this.userModel.findOne({ username });
    if (existing) throw new ConflictException('이미 존재하는 관리자명입니다.');

    const hashed = await bcrypt.hash(password, 10);
    return this.userModel.create({
      username,
      password: hashed,
      role: 'ADMIN',
    });
  }
  async updateRoles(userId: string, role: string) {
    const result = await this.userModel.updateOne(
      { _id: userId },
      { $set: { role } },
    );
    return { success: result.modifiedCount > 0 };
  }

  async deleteUser(userId: string) {
    const result = await this.userModel.updateOne(
      { _id: userId },
      { $set: { isActive: false } },
    );
    return { success: result.modifiedCount > 0 };
  }
  async getMyInfo(userId: string) {
    const user = await this.userModel.findById(userId).select('username role');
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    return {
      userId: user._id,
      username: user.username,
      role: user.role,
    };
  }
  async getUserIdsByRole(role: string) {
    const users = await this.userModel
      .find({ role: role as Role, isActive: true }, { _id: 1 })
      .lean();

    return users.map((u) => u._id.toString());
  }
  async getUsersByRole(role: string): Promise<any[]> {
    return this.userModel
      .find(
        { role: role as Role, isActive: true },
        { _id: 1, username: 1, role: 1 },
      )
      .lean();
  }
}
