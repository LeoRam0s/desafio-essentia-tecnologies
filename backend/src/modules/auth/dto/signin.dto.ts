import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SigninDto {
  @ApiProperty({
    description: 'Email address used to sign in.',
    example: 'joao.silva@example.com',
    maxLength: 100,
    format: 'email',
  })
  @IsString()
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    description: 'Account password.',
    example: 'senha-segura',
    minLength: 6,
    maxLength: 15,
    format: 'password',
  })
  @IsString()
  @MaxLength(15)
  @MinLength(6)
  password: string;
}
