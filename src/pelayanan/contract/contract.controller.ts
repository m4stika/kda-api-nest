import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  ApprovalContractRequest,
  ContractResponse,
  ContractSummaryResponse,
  CreateContractRequest,
  SearchContractRequest,
  UpdateContractRequest,
} from 'src/schema/contract.schema';
import { Logger } from 'winston';
import { ContractService } from './contract.service';

@Controller('pelayanan/contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  async create(
    @Body() request: CreateContractRequest,
  ): Promise<ApiResponse<ContractResponse>> {
    this.logger.debug(`Controller.Contract.create ${JSON.stringify(request)}`);

    const result = await this.contractService.create(request);
    return {
      status: 'success',
      data: result,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @Body() request: UpdateContractRequest,
  ): Promise<ApiResponse<ContractResponse>> {
    this.logger.debug(`Controller.contract.update ${JSON.stringify(request)}`);
    request.id = id;
    const result = await this.contractService.update(request);
    return {
      status: 'success',
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string): Promise<ApiResponse<string>> {
    this.logger.debug(`Controller.contract.delete ${id}`);
    await this.contractService.remove(id);
    return {
      status: 'success',
      data: `Contract id: #${id} has been deleted`,
    };
  }

  @UseGuards(AuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiResponse<ContractResponse[]>> {
    const result = await this.contractService.findAll();
    return {
      status: 'success',
      data: result,
    };
  }

  @UseGuards(AuthGuard)
  @Get('/status/:verificationStatus')
  @HttpCode(HttpStatus.OK)
  async findByStatus(
    @Param('verificationStatus') status: string,
  ): Promise<ApiResponse<ContractResponse[]>> {
    this.logger.warn(`Controller.contract.findByStatus ${status}`);
    const result = await this.contractService.findByStatus(status);
    return {
      status: 'success',
      data: result,
    };
  }

  @UseGuards(AuthGuard)
  @Get('/pagination')
  @HttpCode(HttpStatus.OK)
  async pagination(
    @Query('contractNo') contractNo?: string,
    @Query('contractDate') contractDate?: string,
    @Query('customer') customer?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('size', new ParseIntPipe({ optional: true })) size?: number,
  ): Promise<ApiResponse<Omit<ContractResponse, 'ContractType'>[]>> {
    const request: SearchContractRequest = {
      contractNo,
      contractDate: contractDate ? new Date(contractDate) : undefined,
      customer,
      page: page || 1,
      size: size || 10,
    };
    this.logger.warn(
      `Controller.contract.pagination ${JSON.stringify(request)}`,
    );
    const result = await this.contractService.pagination(request);
    return result;
  }

  @UseGuards(AuthGuard)
  @Patch('submit')
  @HttpCode(HttpStatus.OK)
  async submit(
    @Body() request: string[],
  ): Promise<ApiResponse<Omit<ContractResponse, 'ContractType'>[]>> {
    this.logger.debug(`Controller.contract.submit ${request}`);
    const result = await this.contractService.submit(request);
    return {
      status: 'success',
      data: result,
    };
  }

  @UseGuards(AuthGuard)
  @Patch('approval')
  @HttpCode(HttpStatus.OK)
  async approval(
    @Body() request: ApprovalContractRequest,
  ): Promise<ApiResponse<Omit<ContractResponse, 'ContractType'>>> {
    this.logger.debug(`Controller.contract.approval ${request}`);
    const result = await this.contractService.approval(request);
    return {
      status: 'success',
      data: result,
    };
  }

  @UseGuards(AuthGuard)
  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async summary(): Promise<ApiResponse<ContractSummaryResponse[]>> {
    this.logger.debug(`Controller.contract.summary `);
    const result = await this.contractService.contractSummary();
    return {
      status: 'success',
      data: result,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<ContractResponse>> {
    this.logger.debug(`Controller.contract.get ${id}`);
    const result = await this.contractService.findOne(id);
    return {
      status: 'success',
      data: result,
    };
  }

  @UseGuards(AuthGuard)
  @Post('amendment')
  @UseInterceptors(
    // FileInterceptor('files', { limits: { files: 2 } }),
    FileFieldsInterceptor([
      { name: 'amendmentFileName', maxCount: 1 },
      { name: 'bastFilename', maxCount: 1 },
    ]),
  )
  @HttpCode(HttpStatus.OK)
  async amendment(
    @UploadedFiles()
    files: {
      bastFilename: Express.Multer.File;
      amendmentFileName: Express.Multer.File;
    },
    @Body('id') id: string,
  ): Promise<ApiResponse<unknown>> {
    this.logger.error(`Controller.Contract.amendment ${JSON.stringify(files)}`);

    if (!files) throw new BadRequestException('No file uploaded');

    // if (files.amendmentFileName.length > 1)
    //   throw new BadRequestException('to many file upload per field');
    // const result = await this.contractService.create(request);
    return {
      status: 'success',
      data: files,
    };
  }
}
