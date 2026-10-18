import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from '../../database/entities/genre.entity';
import { TitlesModule } from '../titles/titles.module';
import { GenresController } from './genres.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Genre]), TitlesModule],
  controllers: [GenresController],
})
export class GenresModule {}
