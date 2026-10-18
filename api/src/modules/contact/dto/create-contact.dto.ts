import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsString({ message: 'نام باید متن باشد.' })
  @MinLength(2, { message: 'نام باید حداقل ۲ حرف باشد.' })
  @MaxLength(80, { message: 'نام حداکثر ۸۰ نویسه است.' })
  name!: string;

  @IsEmail({}, { message: 'نشانی ایمیل معتبر نیست.' })
  @MaxLength(254, { message: 'نشانی ایمیل خیلی طولانی است.' })
  email!: string;

  @IsOptional()
  @IsString({ message: 'موضوع باید متن باشد.' })
  @MaxLength(120, { message: 'موضوع حداکثر ۱۲۰ نویسه است.' })
  subject?: string;

  @IsString({ message: 'متن پیام باید متن باشد.' })
  @MinLength(10, { message: 'متن پیام باید حداقل ۱۰ حرف باشد.' })
  @MaxLength(2000, { message: 'متن پیام حداکثر ۲۰۰۰ نویسه است.' })
  message!: string;
}
