import { Module } from '@nestjs/common';
import { ContractTypeService } from './contract-type.service';
import { ContractTypeController } from './contract-type.controller';

@Module({
  controllers: [ContractTypeController],
  providers: [ContractTypeService],
})
export class ContractTypeModule {}
