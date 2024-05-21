import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { PelayananModule } from './pelayanan/pelayanan.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [CommonModule, UserModule, PelayananModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
