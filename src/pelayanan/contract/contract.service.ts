import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Contract,
  ContractType,
  Customer,
  VerificationLevel,
  VerificationStatus,
} from '@prisma/client';
import { format, lastDayOfMonth } from 'date-fns';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  ApprovalContractRequest,
  ContractResponse,
  ContractSummaryResponse,
  ContractValidation,
  CreateContractRequest,
  SearchContractRequest,
  UpdateContractRequest,
} from 'src/schema/contract.schema';
import { Logger } from 'winston';
import { ZodType } from 'zod';

@Injectable()
export class ContractService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}

  toContractResponse<T extends object>(
    data: Contract & { Customer: Customer } & { ContractType?: ContractType },
  ): T {
    // if (!data) return false;

    return {
      id: data.id,
      contractNo: data.contractNo,
      description: data.description,
      contractValue: data.contractValue,
      includePPN: data.includePPN,
      percentPPN: data.percentPPN,
      contractDate: data.contractDate,
      validityPeriod: data.validityPeriod,
      contractStatus: data.contractStatus,
      verificationLevel: data.verificationLevel,
      customerId: data.customerId,
      contractTypeId: data.contractTypeId,
      accumulatedPayment: data.accumulatedPayment,
      rejectedRemark: data.rejectedRemark,
      bastAmount: data.bastAmount,
      billedAmount: data.billedAmount,
      paidAmount: data.paidAmount,
      balanceAmount: data.balanceAmount,
      oldContractValue: data.oldContractValue,
      oldValidityPeriod: data.oldValidityPeriod,
      Customer: data.Customer,
      ContractType: data.ContractType,
    } as T;
    // return re;
  }

  async checkCustomerMustExist(id: string): Promise<Customer> {
    const customer = await this.prisma.customer.findFirst({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async checkContractTypeMustExist(id: string): Promise<void> {
    const result = await this.prisma.contractType.findFirst({
      where: { id },
    });

    if (!result) {
      throw new NotFoundException('Contract Type not found');
    }
  }

  async checkContractMustExist<T>(id: string, include?: object): Promise<T> {
    const result = await this.prisma.contract.findFirst({
      where: { id },
      include,
    });

    if (!result) {
      throw new NotFoundException('Contract not found');
    }
    return result as T;
  }

  async create(request: CreateContractRequest): Promise<ContractResponse> {
    const createRequest =
      this.validationService.validate<CreateContractRequest>(
        ContractValidation.CREATE as ZodType,
        request,
      );

    const totalInDatabase = await this.prisma.contract.count({
      where: { contractNo: request.contractNo },
    });

    if (totalInDatabase > 0)
      throw new ConflictException(`${request.contractNo} already exists `);

    await this.checkCustomerMustExist(createRequest.customerId);
    await this.checkContractTypeMustExist(createRequest.contractTypeId);

    const contract = await this.prisma.contract.create({
      data: {
        ...createRequest,
        // Customer: { connect: { id: createRequest.customerId } },
        // ContractType: { connect: { id: createRequest.contractTypeId } },
      },
      include: { Customer: true, ContractType: true },
    });
    return contract;
  }

  async update(request: UpdateContractRequest): Promise<ContractResponse> {
    const updateRequest: UpdateContractRequest =
      this.validationService.validate(
        ContractValidation.UPDATE as ZodType,
        request,
      );

    const { id, ...newRequest } = updateRequest;

    await this.checkContractMustExist(id);
    await this.checkContractTypeMustExist(updateRequest.contractTypeId);
    await this.checkCustomerMustExist(updateRequest.customerId);

    return this.prisma.contract.update({
      where: { id },
      data: newRequest,
      include: { ContractType: true, Customer: true },
    });
  }

  async remove(id: string): Promise<Contract> {
    const contract = await this.checkContractMustExist<Contract>(id);

    if (contract.verificationLevel !== 'ADMIN') {
      throw new ConflictException(
        `${contract.contractNo} status has been locked`,
      );
    }

    return await this.prisma.contract.delete({ where: { id } });
  }

  async findOne(id: string): Promise<ContractResponse> {
    const contract = await this.checkContractMustExist<ContractResponse>(id, {
      ContractType: true,
      Customer: true,
    });

    return contract;
  }

  async findAll(): Promise<ContractResponse[]> {
    return await this.prisma.contract.findMany({
      where: { contractStatus: { notIn: ['Posted', 'Closed'] } },
      include: {
        ContractType: true,
        Customer: true,
      },
    });
  }

  async findByStatus(verificationStatus: string): Promise<ContractResponse[]> {
    const arrContractStatus = verificationStatus.split(',');

    return this.prisma.contract.findMany({
      where: {
        contractStatus: { in: arrContractStatus as VerificationStatus[] },
      },
      include: {
        Customer: true,
        // ContractApproval: true,
        ContractType: true,
        // Bast: { include: { Invoice: true } },
        // Amendment: true,
      },
    });
  }

  async pagination(
    request: SearchContractRequest,
  ): Promise<ApiResponse<Omit<ContractResponse, 'ContractType'>[]>> {
    const searchRequest: SearchContractRequest =
      this.validationService.validate(ContractValidation.SEARCH, request);

    const filter = [];

    const { contractNo, contractDate, customer } = searchRequest;

    if (contractDate) {
      // add contractDate filter
      filter.push({ contractDate });
    }
    if (contractNo) {
      // add contractNo filter
      filter.push({ contractNo: { contains: contractNo } });
    }
    if (customer) {
      // add filter by customer
      filter.push({ Customer: { name: { contains: customer } } });
    }

    const skip = (searchRequest.page - 1) * searchRequest.size;

    const contracts = await this.prisma.contract.findMany({
      where: { contractStatus: { notIn: ['Closed', 'Posted'] }, AND: filter },
      take: searchRequest.size,
      skip,
      include: { Customer: true },
    });

    const total = await this.prisma.contract.count({
      where: { contractStatus: { notIn: ['Closed', 'Posted'] }, AND: filter },
    });

    return {
      status: 'success',
      data: contracts.map((contract) => this.toContractResponse(contract)),
      // data: contracts,
      paging: {
        totalRows: total,
        totalPages: Math.ceil(total / searchRequest.size),
        rowPerPage: searchRequest.size,
        page: searchRequest.page,
        previous: searchRequest.page <= 1 ? 1 : searchRequest.page - 1,
        next: searchRequest.page + 1,
        hasMore: true,
      },
    };
  }

  async submit(
    request: string[],
  ): Promise<Omit<ContractResponse, 'ContractType'>[]> {
    const submitRequest: string[] = this.validationService.validate(
      ContractValidation.SUBMIT as ZodType,
      request,
    );
    const txResult = await this.prisma.$transaction(async (tx) => {
      const dataResult: Omit<ContractResponse, 'ContractType'>[] = [];
      const totalInDatabase = await this.prisma.contract.count({
        where: { id: { in: submitRequest } },
      });
      if (totalInDatabase === 0)
        throw new NotFoundException('No data is processed');

      for await (const id of request) {
        // update contract status and verification level and insert to contract-approval
        const result = await tx.contract.update({
          where: { id },
          data: {
            contractStatus: 'Submitted',
            verificationLevel: 'ADMIN',
            /* ContractApproval: {
            create: {
              approvalBy: "ADMIN",
              approvalStatus: "Submitted",
              remark: "Submit by admin",
            },
          }, */
          },
          include: { Customer: true },
        });
        dataResult.push(result);
      }
      return dataResult;
    });
    // if (!txResult) throw new NotFoundException('No data is processed');
    return txResult;
  }

  async approval(
    request: ApprovalContractRequest,
  ): Promise<Omit<ContractResponse, 'ContractType'>> {
    const approvalRequest: ApprovalContractRequest =
      this.validationService.validate(
        ContractValidation.APPROVAL as ZodType,
        request,
      );

    const { id, verificationStatus, rejectedRemark } = approvalRequest;
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      select: { contractStatus: true, verificationLevel: true },
    });

    if (!contract) throw new NotFoundException('Contract is not found');

    if (verificationStatus === 'Rejected' && !rejectedRemark)
      throw new UnprocessableEntityException('Rejected remark required');
    const { contractStatus } = contract;

    const nextContractStatus: VerificationStatus =
      verificationStatus === 'Rejected'
        ? 'Rejected'
        : verificationStatus === 'Released'
          ? 'Released'
          : 'Approved';
    let nextVerificationLevel: VerificationLevel = 'SUPERVISOR';
    if (nextContractStatus === 'Rejected') {
      if (contractStatus === 'Submitted') nextVerificationLevel = 'SUPERVISOR';
      else nextVerificationLevel = 'MANAGER';
    }
    if (nextContractStatus === 'Released') nextVerificationLevel = 'SUPERVISOR';
    if (nextContractStatus === 'Approved') nextVerificationLevel = 'MANAGER';

    const result = await this.prisma.contract.update({
      where: { id },
      data: {
        contractStatus: nextContractStatus,
        verificationLevel: nextVerificationLevel,
        rejectedRemark:
          rejectedRemark || `${nextContractStatus} by ${nextVerificationLevel}`,
        ContractApproval: {
          create: {
            approvalBy: nextVerificationLevel,
            approvalStatus: nextContractStatus,
            remark:
              rejectedRemark ||
              `${nextContractStatus} by ${nextVerificationLevel}`,
          },
        },
      },
      include: { Customer: true },
    });
    return result;
  }

  async contractSummary(): Promise<ContractSummaryResponse[]> {
    const today = new Date();
    const firstDateOfMonth = format(today, 'yyyy-MM-01');
    const lastDateOfMonth = format(lastDayOfMonth(today), 'yyyy-MM-dd');

    const contracts = await this.prisma.contract.groupBy({
      where: {
        contractDate: {
          gte: new Date(firstDateOfMonth),
          lte: new Date(lastDateOfMonth),
        },
      },
      by: ['contractDate'],
      orderBy: { contractDate: 'asc' },
      _sum: { contractValue: true },
    });
    return contracts.map(({ _sum, ...item }) => ({
      ...item,
      amount: _sum.contractValue,
    }));
  }
  /*
	const amendment = async (request: CreateAmendmentRequest, files: FileMulter): Promise<Contract> => {
		const { id, Contract, contractValue, contractValidityPeriod, ...value } = request;
		validate<TAmendment>(amendmentSchema, {
			...value,
			amendmentValue: new Prisma.Decimal(value.amendmentValue),
		});

		const contractInDatabase = await prisma.contract.findUnique({ where: { id } });
		if (!contractInDatabase)
			throw new ResponseError(STATUS_CONFLICT, "Contract reference doesn't exist in database");

		const newValue = {
			...value,
			contractValue: contractInDatabase.contractValue,
			contractValidityPeriod: contractInDatabase.validityPeriod,
			amendmentValue: Number(value.amendmentValue),
			amendmentDate: new Date(value.amendmentDate),
			validityPeriod: new Date(value.validityPeriod),
			amendmentFileName: files["amendmentFileName"]?.[0].filename,
			contractId: undefined,
			createdAt: undefined,
			updatedAt: undefined,
		};

		return prisma.contract.update({
			where: { id },
			data: {
				oldContractValue: contractInDatabase.contractValue,
				oldValidityPeriod: contractInDatabase.validityPeriod,
				contractValue: newValue.amendmentValue,
				validityPeriod: newValue.validityPeriod,
				Amendment: {
					// update all amendment record set status Active with false
					updateMany: {
						where: { contractId: contractInDatabase.id, isActive: true },
						data: { isActive: false },
					},
					// create new amendment record with status active true
					create: newValue,
				},
			},
			include: {
				Customer: true,
				ContractApproval: true,
				ContractType: true,
				Bast: { include: { Invoice: true } },
				Amendment: true,
			},
		});
	};
	 */
}
