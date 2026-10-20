import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class SetTop10Dto {
  @IsArray({ message: 'لیست باید آرایه باشد.' })
  @ArrayMaxSize(10, { message: 'حداکثر ۱۰ عنوان برای برترین‌ها.' })
  @IsString({ each: true, message: 'شناسه عنوان معتبر نیست.' })
  slugs!: string[];
}
