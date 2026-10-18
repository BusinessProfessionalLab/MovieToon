import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actor } from '../../database/entities/actor.entity';
import { TitlesModule } from '../titles/titles.module';
import { ActorsController } from './actors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Actor]), TitlesModule],
  controllers: [ActorsController],
})
export class ActorsModule {}
