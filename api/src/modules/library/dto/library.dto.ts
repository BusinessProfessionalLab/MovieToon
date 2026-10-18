import { ArrayUnique, IsArray, IsInt, IsString, MaxLength, Min } from 'class-validator';

export class SlugListDto {
  @IsArray({ message: 'فهرست باید آرایه باشد.' })
  @ArrayUnique({ message: 'مقادیر تکراری مجاز نیست.' })
  @IsString({ each: true, message: 'هر شناسه باید متن باشد.' })
  @MaxLength(128, { each: true, message: 'شناسه خیلی طولانی است.' })
  slugs!: string[];
}

export class ProgressDto {
  @IsString({ message: 'شناسه عنوان باید متن باشد.' })
  @MaxLength(128, { message: 'شناسه خیلی طولانی است.' })
  slug!: string;

  @IsInt({ message: 'زمان باید عدد صحیح باشد.' })
  @Min(0, { message: 'زمان معتبر نیست.' })
  seconds!: number;
}
