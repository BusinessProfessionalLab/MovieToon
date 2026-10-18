import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ok } from '../../common/response';
import { TitleComment } from '../../database/entities/comment.entity';
import { Title } from '../../database/entities/title.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('comments')
@Controller('api/titles/:slug/comments')
export class CommentsController {
  constructor(
    @InjectRepository(TitleComment) private readonly comments: Repository<TitleComment>,
    @InjectRepository(Title) private readonly titles: Repository<Title>,
  ) {}

  @Get()
  async list(@Param('slug') slug: string) {
    if (!(await this.titles.exist({ where: { slug } }))) {
      throw new NotFoundException({ code: 'NOT_FOUND', error: 'عنوان پیدا نشد.' });
    }
    return ok(await this.comments.find({ where: { titleSlug: slug }, order: { id: 'DESC' } }));
  }

  @Post()
  async create(@Param('slug') slug: string, @Body() dto: CreateCommentDto) {
    if (!(await this.titles.exist({ where: { slug } }))) {
      throw new NotFoundException({ code: 'NOT_FOUND', error: 'عنوان پیدا نشد.' });
    }
    const row = await this.comments.save({
      titleSlug: slug,
      author: dto.author.trim(),
      avatar: '/images/actors/a1.svg',
      date: new Date().toISOString().slice(0, 10),
      rating: dto.rating ?? 0,
      text: dto.text.trim(),
      likes: 0,
    });
    return ok(row, 'دیدگاه شما با موفقیت ثبت شد.');
  }
}
