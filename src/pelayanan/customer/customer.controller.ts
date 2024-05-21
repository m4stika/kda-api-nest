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
  CreateCustomerRequest,
  CustomerResponse,
  UpdateCustomerRequest,
} from 'src/schema/customer.schema';
import { Logger } from 'winston';
import { CustomerService } from './customer.service';

@Controller('pelayanan/customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  async create(
    @Body() request: CreateCustomerRequest,
  ): Promise<ApiResponse<CustomerResponse>> {
    this.logger.debug(`Controller.customer.create ${JSON.stringify(request)}`);

    const result = await this.customerService.create(request);
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
    @Body() request: UpdateCustomerRequest,
  ): Promise<ApiResponse<CustomerResponse>> {
    request.id = id;
    const result = await this.customerService.update(request);
    return {
      status: 'success',
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string): Promise<ApiResponse<string>> {
    await this.customerService.remove(id);
    return {
      status: 'success',
      data: 'customer has been deleted',
    };
  }

  @UseGuards(AuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ApiResponse<CustomerResponse[]>> {
    const result = await this.customerService.findAll();
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
  ): Promise<ApiResponse<CustomerResponse>> {
    const result = await this.customerService.findOne(id);
    return {
      status: 'success',
      data: result,
    };
  }
}
