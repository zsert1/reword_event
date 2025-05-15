import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import {
  LoginHistory,
  LoginHistorySchema,
} from 'src/loginHistory/schemas/loginHistory.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://mongodb:27017/auth_db'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: LoginHistory.name, schema: LoginHistorySchema },
    ]),
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
