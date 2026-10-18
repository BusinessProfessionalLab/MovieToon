import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../../database/entities/collection.entity';
import { TitlesModule } from '../titles/titles.module';
import { CollectionsController } from './collections.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Collection]), TitlesModule],
  controllers: [CollectionsController],
})
export class CollectionsModule {}
