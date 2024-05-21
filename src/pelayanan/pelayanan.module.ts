import { Module } from '@nestjs/common';
import { ContractTypeModule } from './contract-type/contract-type.module';
import { ContractModule } from './contract/contract.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  controllers: [],
  providers: [],
  imports: [ContractTypeModule, ContractModule, CustomerModule],
})
export class PelayananModule {}
