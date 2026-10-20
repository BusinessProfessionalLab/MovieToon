import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class SetHomeAnimationDto {
  @IsArray({ message: 'لیست باید آرایه باشد.' })
  @ArrayMaxSize(30, { message: 'حداکثر ۳۰ عنوان برای انیمیشن‌های محبوب.' })
  @IsString({ each: true, message: 'شناسه عنوان معتبر نیست.' })
  slugs!: string[];
}
