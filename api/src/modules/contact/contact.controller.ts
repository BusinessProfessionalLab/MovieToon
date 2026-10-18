import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ok } from '../../common/response';
import { ContactMessage } from '../../database/entities/contact-message.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@ApiTags('contact')
@Controller('api/contact')
export class ContactController {
  constructor(@InjectRepository(ContactMessage) private readonly messages: Repository<ContactMessage>) {}

  @Post()
  async create(@Body() dto: CreateContactDto) {
    const row = await this.messages.save({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      subject: dto.subject?.trim() ?? '',
      message: dto.message.trim(),
      createdAt: new Date().toISOString(),
    });
    return ok({ id: row.id }, 'پیام شما ثبت شد.');
  }
}
