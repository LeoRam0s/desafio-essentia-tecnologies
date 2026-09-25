import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: 'Full name of the new user.',
    example: 'João Silva',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Unique email address used to sign in.',
    example: 'joao.silva@example.com',
    maxLength: 100,
    format: 'email',
  })
  @IsString()
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    description: 'Password used to protect the account.',
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
