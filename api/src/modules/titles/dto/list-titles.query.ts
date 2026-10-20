import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListTitlesQuery {
  @IsOptional()
  @IsIn(['movie', 'series', 'animation'], { message: 'نوع عنوان معتبر نیست.' })
  type?: 'movie' | 'series' | 'animation';

  @IsOptional()
  @IsString({ message: 'ژانر باید متن باشد.' })
  @MaxLength(64, { message: 'ژانر خیلی طولانی است.' })
  genre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'سال باید عدد صحیح باشد.' })
  @Min(1300, { message: 'سال معتبر نیست.' })
  @Max(1500, { message: 'سال معتبر نیست.' })
  year?: number;

  @IsOptional()
  @IsString({ message: 'کشور باید متن باشد.' })
  @MaxLength(64, { message: 'کشور خیلی طولانی است.' })
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'امتیاز باید عدد صحیح باشد.' })
  @Min(0, { message: 'امتیاز معتبر نیست.' })
  @Max(10, { message: 'امتیاز معتبر نیست.' })
  minRating?: number;

  @IsOptional()
  @IsString({ message: 'جستجو باید متن باشد.' })
  @MaxLength(120, { message: 'متن جستجو خیلی طولانی است.' })
  q?: string;

  @IsOptional()
  @IsIn(['rating', 'newest', 'year', 'views'], { message: 'مرتب‌سازی معتبر نیست.' })
  sort?: 'rating' | 'newest' | 'year' | 'views' = 'newest';

  @IsOptional()
  @IsString({ message: 'رده سنی باید متن باشد.' })
  @MaxLength(32, { message: 'رده سنی خیلی طولانی است.' })
  ageGroup?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean({ message: 'پرچم ویژه معتبر نیست.' })
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean({ message: 'پرچم انیمیشن محبوب معتبر نیست.' })
  homeAnimation?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'شماره صفحه باید عدد صحیح باشد.' })
  @Min(1, { message: 'شماره صفحه معتبر نیست.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'اندازه صفحه باید عدد صحیح باشد.' })
  @Min(1, { message: 'اندازه صفحه معتبر نیست.' })
  @Max(50, { message: 'اندازه صفحه حداکثر ۵۰ است.' })
  pageSize?: number = 12;
}
