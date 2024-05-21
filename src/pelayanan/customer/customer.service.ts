import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  CreateCustomerRequest,
  CustomerResponse,
  CustomerValidation,
  UpdateCustomerRequest,
} from 'src/schema/customer.schema';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}

  async checkRecordMustExists(id: string): Promise<CustomerResponse> {
    const record = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!record) throw new NotFoundException(`${id} not found `);

    return record;
  }

  async create(request: CreateCustomerRequest): Promise<CustomerResponse> {
    const createRequest: CreateCustomerRequest =
      this.validationService.validate(CustomerValidation.CREATE, request);

    const totalInDatabase = await this.prisma.customer.count({
      where: { name: request.name },
    });

    if (totalInDatabase > 0)
      throw new ConflictException(`${request.name} already exists `);

    return this.prisma.customer.create({
      data: createRequest,
    });
  }

  async update(request: UpdateCustomerRequest): Promise<CustomerResponse> {
    const updateRequest: UpdateCustomerRequest =
      this.validationService.validate(CustomerValidation.UPDATE, request);

    const { id, ...newRequest } = updateRequest;

    await this.checkRecordMustExists(id);

    return this.prisma.customer.update({
      where: { id },
      data: newRequest,
    });
  }

  async remove(id: string): Promise<CustomerResponse> {
    const customer = await this.checkRecordMustExists(id);

    const totalContract = await this.prisma.contract.count({
      where: { customerId: id },
    });

    if (totalContract > 0)
      throw new ConflictException(`${customer.name} status has been locked`);

    return await this.prisma.customer.delete({ where: { id } });
  }

  async findAll(): Promise<CustomerResponse[]> {
    return this.prisma.customer.findMany({
      // include: {
      //   Contract: { where: { contractStatus: { not: 'Closed' } } },
      //   Revenue: true,
      //   AssignmentReceivables: true,
      //   CollectionReceivables: true,
      // },
    });
  }

  async findOne(id: string): Promise<CustomerResponse> {
    const customer = await this.checkRecordMustExists(id);

    return customer;
  }
}
