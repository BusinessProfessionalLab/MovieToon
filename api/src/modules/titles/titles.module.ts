import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleComment } from '../../database/entities/comment.entity';
import { Episode } from '../../database/entities/episode.entity';
import { Title } from '../../database/entities/title.entity';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Title, Episode, TitleComment])],
  controllers: [TitlesController],
  providers: [TitlesService],
  exports: [TitlesService],
})
export class TitlesModule {}
