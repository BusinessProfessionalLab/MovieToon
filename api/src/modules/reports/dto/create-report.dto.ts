import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsOptional()
  @IsString({ message: 'لینک باید متن باشد.' })
  @MaxLength(500, { message: 'لینک خیلی طولانی است.' })
  link?: string;

  @IsString({ message: 'نوع گزارش الزامی است.' })
  @IsIn(['نقض حق نشر', 'محتوای نامناسب', 'اطلاعات نادرست', 'سایر موارد'], { message: 'نوع گزارش معتبر نیست.' })
  type!: string;

  @IsString({ message: 'توضیحات باید متن باشد.' })
  @MinLength(10, { message: 'توضیحات باید حداقل ۱۰ حرف باشد.' })
  @MaxLength(2000, { message: 'توضیحات حداکثر ۲۰۰۰ نویسه است.' })
  description!: string;
}
