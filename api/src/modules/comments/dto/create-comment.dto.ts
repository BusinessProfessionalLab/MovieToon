import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'نام باید متن باشد.' })
  @MinLength(2, { message: 'نام باید حداقل ۲ حرف باشد.' })
  @MaxLength(60, { message: 'نام حداکثر ۶۰ نویسه است.' })
  author!: string;

  @IsString({ message: 'متن دیدگاه باید متن باشد.' })
  @MinLength(5, { message: 'متن دیدگاه باید حداقل ۵ حرف باشد.' })
  @MaxLength(1000, { message: 'متن دیدگاه حداکثر ۱۰۰۰ نویسه است.' })
  text!: string;

  @IsOptional()
  @IsInt({ message: 'امتیاز باید عدد صحیح باشد.' })
  @Min(0, { message: 'امتیاز معتبر نیست.' })
  @Max(10, { message: 'امتیاز معتبر نیست.' })
  rating?: number;
}
