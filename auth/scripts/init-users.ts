import mongoose, { Types } from 'mongoose';
import { Role, UserSchema } from 'src/user/schemas/user.schema';
import * as bcrypt from 'bcrypt';
async function seed() {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/auth_db';
  await mongoose.connect(MONGO_URI);

  const User = mongoose.model('User', UserSchema);

  const baseUsers = [
    {
      _id: new Types.ObjectId('664000000000000000000001'),
      username: 'admin@example.com',
      password: 'admin1234',
      role: 'ADMIN' as Role,
    },
    {
      _id: new Types.ObjectId('664000000000000000000002'),
      username: 'operator@example.com',
      password: 'operator1234',
      role: 'OPERATOR' as Role,
    },
    {
      _id: new Types.ObjectId('664000000000000000000003'),
      username: 'auditor@example.com',
      password: 'auditor1234',
      role: 'AUDITOR' as Role,
    },
  ];
  const userUsers = Array.from({ length: 10 }, (_, i) => {
    const hex = (100 + i).toString(16).padStart(4, '0');
    return {
      _id: new Types.ObjectId(`66400000000000000000${hex}`),
      username: `user${i + 1}@example.com`,
      password: 'user1234',
      role: 'USER' as Role,
    };
  });

  const allUsers = [...baseUsers, ...userUsers];

  for (const u of allUsers) {
    const exists = await User.exists({ username: u.username });
    if (!exists) {
      const hashed = await bcrypt.hash(u.password, 10);
      await new User({
        _id: u._id,
        username: u.username,
        password: hashed,
        role: u.role,
        isDeleted: false,
      }).save();
    }
  }

  await mongoose.disconnect();
  console.log('🌱 User seeding complete.');
  process.exit();
}

seed().catch((err) => {
  console.error('❌ User seed failed:', err);
  process.exit(1);
});
