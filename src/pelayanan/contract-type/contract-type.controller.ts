import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  ContractTypeResponse,
  CreateContractTypeRequest,
  UpdateContractTypeRequest,
} from 'src/schema/contract-type.schema';
import { Logger } from 'winston';
import { ContractTypeService } from './contract-type.service';

@Controller('pelayanan/contract-types')
export class ContractTypeController {
  constructor(
    private readonly contractTypeService: ContractTypeService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  async create(
    // @Auth() user: unknown,
    @Body() request: CreateContractTypeRequest,
  ): Promise<ApiResponse<ContractTypeResponse>> {
    this.logger.debug(
      `Controller.Contract-type.create ${JSON.stringify(request)}`,
    );

    const result = await this.contractTypeService.create(request);
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
    @Body() request: UpdateContractTypeRequest,
  ): Promise<ApiResponse<ContractTypeResponse>> {
    // this.logger.debug({ source: `Controller.Contract-type.update`, request });
    this.logger.debug(`Controller.Contract-type.update %O`, request);
    request.id = id;
    const result = await this.contractTypeService.update(request);
    return {
      status: 'success',
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string): Promise<ApiResponse<string>> {
    await this.contractTypeService.remove(id);
    return {
      status: 'success',
      data: 'Contract-type has been deleted',
    };
  }

  @UseGuards(AuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiResponse<ContractTypeResponse[]>> {
    const result = await this.contractTypeService.findAll();
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
  ): Promise<ApiResponse<ContractTypeResponse>> {
    const result = await this.contractTypeService.findOne(id);
    return {
      status: 'success',
      data: result,
    };
  }
}
