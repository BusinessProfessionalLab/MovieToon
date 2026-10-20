import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class SetFeaturedDto {
  @IsArray({ message: 'لیست باید آرایه باشد.' })
  @ArrayMaxSize(30, { message: 'حداکثر ۳۰ عنوان برای Hero.' })
  @IsString({ each: true, message: 'شناسه عنوان معتبر نیست.' })
  slugs!: string[];
}
