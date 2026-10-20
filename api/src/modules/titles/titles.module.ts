import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleComment } from '../../database/entities/comment.entity';
import { DownloadLink } from '../../database/entities/download-link.entity';
import { Episode } from '../../database/entities/episode.entity';
import { Title } from '../../database/entities/title.entity';
import { User } from '../../database/entities/user.entity';
import { AdminGuard } from '../auth/admin.guard';
import { AuthModule } from '../auth/auth.module';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Title, Episode, TitleComment, DownloadLink, User]), AuthModule],
  controllers: [TitlesController],
  providers: [TitlesService, AdminGuard],
  exports: [TitlesService],
})
export class TitlesModule {}
