import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  ContractTypeResponse,
  ContractTypeValidation,
  CreateContractTypeRequest,
  UpdateContractTypeRequest,
} from 'src/schema/contract-type.schema';
import { Logger } from 'winston';

@Injectable()
export class ContractTypeService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}

  async checkAccountMustExist(id: string): Promise<void> {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException(`${id} Not found in table Account`);
    }

    // return account.id;
  }

  async checkRecordMustExists(id: string): Promise<ContractTypeResponse> {
    const record = await this.prisma.contractType.findUnique({
      where: { id },
    });

    if (!record) throw new NotFoundException(`${id} not found `);

    return record;
  }

  async create(
    request: CreateContractTypeRequest,
  ): Promise<ContractTypeResponse> {
    const createRequest: CreateContractTypeRequest =
      this.validationService.validate(ContractTypeValidation.CREATE, request);

    const totalInDatabase = await this.prisma.contractType.count({
      where: { name: request.name },
    });

    if (totalInDatabase > 0)
      throw new ConflictException(`${request.name} already exists `);

    await this.checkAccountMustExist(request.revenueId);
    await this.checkAccountMustExist(request.assignmentReceivablesId);
    await this.checkAccountMustExist(request.collectionReceivablesId);

    return this.prisma.contractType.create({
      data: createRequest,
    });
  }

  async update(
    request: UpdateContractTypeRequest,
  ): Promise<ContractTypeResponse> {
    const updateRequest: UpdateContractTypeRequest =
      this.validationService.validate(ContractTypeValidation.UPDATE, request);

    const { id, ...newRequest } = updateRequest;

    await this.checkAccountMustExist(request.revenueId);
    await this.checkAccountMustExist(request.assignmentReceivablesId);
    await this.checkAccountMustExist(request.collectionReceivablesId);

    await this.checkRecordMustExists(id);

    return this.prisma.contractType.update({
      where: { id },
      data: newRequest,
    });
  }

  async remove(id: string): Promise<ContractTypeResponse> {
    const contractType = await this.checkRecordMustExists(id);

    const totalContract = await this.prisma.contract.count({
      where: { contractTypeId: id },
    });

    if (totalContract > 0)
      throw new ConflictException(
        `${contractType.name} status has been locked`,
      );

    return await this.prisma.contractType.delete({ where: { id } });
  }

  async findAll(): Promise<ContractTypeResponse[]> {
    return this.prisma.contractType.findMany({
      // include: {
      //   Contract: { where: { contractStatus: { not: 'Closed' } } },
      //   Revenue: true,
      //   AssignmentReceivables: true,
      //   CollectionReceivables: true,
      // },
    });
  }

  async findOne(id: string): Promise<ContractTypeResponse> {
    const contractType = await this.checkRecordMustExists(id);

    return contractType;
  }
}
