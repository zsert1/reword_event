import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async signup(username: string, password: string) {
    const existing = await this.userModel.findOne({ username });
    if (existing) throw new ConflictException('이미 존재하는 유저명입니다.');

    const hashed = await bcrypt.hash(password, 10);
    const user = new this.userModel({ username, password: hashed });
    return user.save();
  }
  getHello(): string {
    return 'Hello World!';
  }
}
