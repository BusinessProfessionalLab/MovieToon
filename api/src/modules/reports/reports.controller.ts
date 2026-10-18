import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ok } from '../../common/response';
import { Report } from '../../database/entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('reports')
@Controller('api/reports')
export class ReportsController {
  constructor(@InjectRepository(Report) private readonly reports: Repository<Report>) {}

  @Post()
  async create(@Body() dto: CreateReportDto) {
    const row = await this.reports.save({
      link: dto.link?.trim() ?? '',
      type: dto.type,
      description: dto.description.trim(),
      createdAt: new Date().toISOString(),
    });
    return ok({ id: row.id }, 'گزارش شما ثبت شد.');
  }
}
