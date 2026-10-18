import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleComment } from '../../database/entities/comment.entity';
import { Title } from '../../database/entities/title.entity';
import { CommentsController } from './comments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TitleComment, Title])],
  controllers: [CommentsController],
})
export class CommentsModule {}
