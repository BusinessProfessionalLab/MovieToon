import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'نام باید متن باشد.' })
  @MinLength(2, { message: 'نام باید حداقل ۲ نویسه باشد.' })
  @MaxLength(80, { message: 'نام حداکثر ۸۰ نویسه است.' })
  name!: string;

  @IsEmail({}, { message: 'نشانی ایمیل معتبر نیست.' })
  @MaxLength(254, { message: 'نشانی ایمیل خیلی طولانی است.' })
  email!: string;

  @IsString({ message: 'گذرواژه باید متن باشد.' })
  @MinLength(12, { message: 'گذرواژه باید حداقل ۱۲ نویسه باشد.' })
  @MaxLength(128, { message: 'گذرواژه حداکثر ۱۲۸ نویسه است.' })
  password!: string;
}
