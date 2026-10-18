import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'نشانی ایمیل معتبر نیست.' })
  @MaxLength(254, { message: 'نشانی ایمیل خیلی طولانی است.' })
  email!: string;

  @IsString({ message: 'گذرواژه باید متن باشد.' })
  @MinLength(1, { message: 'گذرواژه الزامی است.' })
  @MaxLength(128, { message: 'گذرواژه حداکثر ۱۲۸ نویسه است.' })
  password!: string;
}
