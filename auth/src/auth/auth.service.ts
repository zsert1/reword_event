import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(username: string, password: string) {
    const existing = await this.userModel.findOne({ username });
    if (existing) throw new ConflictException('이미 존재하는 유저명입니다.');

    const hashed = await bcrypt.hash(password, 10);
    const user = new this.userModel({ username, password: hashed });
    return user.save();
  }

  async login(username: string, password: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) throw new UnauthorizedException('올바른 정보가 아닙니다.');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('올바른 정보가 아닙니다.');
    const payload = {
      sub: user._id,
      username: user.username,
      roles: user.roles,
    };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
  getHello(): string {
    return 'Hello World!';
  }
}
