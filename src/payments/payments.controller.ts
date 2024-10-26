import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
    Req,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Payment } from './entity/payment.entity';

@ApiTags('결제(Payments)')
@ApiBearerAuth('JWT')
@Controller('payments')
export class PaymentsController {
constructor(private readonly paymentsService: PaymentsService) {}

@UseGuards(JwtGuard)
@Post()
@ApiOperation({ summary: '결제 생성', description: '새로운 결제 정보를 생성합니다.' })
@ApiResponse({ status: 201, description: '결제가 성공적으로 생성되었습니다.', type: Payment })
@ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
async create(@Body() createPaymentDto: CreatePaymentDto, @Req() req) {
    // 필요에 따라 사용자 정보를 사용할 수 있습니다.
    return this.paymentsService.create(createPaymentDto);
}

@UseGuards(JwtGuard)
@Get()
@ApiOperation({ summary: '모든 결제 조회', description: '전체 결제 내역을 조회합니다.' })
@ApiResponse({ status: 200, description: '결제 목록을 반환합니다.', type: [Payment] })
async findAll() {
    return this.paymentsService.findAll();
}

@UseGuards(JwtGuard)
@Get(':id')
@ApiOperation({ summary: '특정 결제 조회', description: 'ID를 기반으로 특정 결제 정보를 조회합니다.' })
@ApiParam({ name: 'id', description: '결제 ID', example: 1 })
@ApiResponse({ status: 200, description: '결제 정보를 반환합니다.', type: Payment })
@ApiResponse({ status: 404, description: '결제를 찾을 수 없습니다.' })
async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
}

@UseGuards(JwtGuard)
@Put(':id')
@ApiOperation({ summary: '결제 정보 수정', description: 'ID를 기반으로 결제 정보를 수정합니다.' })
@ApiParam({ name: 'id', description: '결제 ID', example: 1 })
@ApiResponse({ status: 200, description: '결제 정보가 성공적으로 수정되었습니다.', type: Payment })
@ApiResponse({ status: 404, description: '결제를 찾을 수 없습니다.' })
async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
) {
    return this.paymentsService.update(id, updatePaymentDto);
}

@UseGuards(JwtGuard)
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiOperation({ summary: '결제 삭제', description: 'ID를 기반으로 결제 정보를 삭제합니다.' })
@ApiParam({ name: 'id', description: '결제 ID', example: 1 })
@ApiResponse({ status: 204, description: '결제가 성공적으로 삭제되었습니다.' })
@ApiResponse({ status: 404, description: '결제를 찾을 수 없습니다.' })
async remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
}
}
  