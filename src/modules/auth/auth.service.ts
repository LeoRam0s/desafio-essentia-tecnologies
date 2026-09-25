import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository.js';
import { SignupDto } from './dto/signup.dto.js';
import { EmailAlreadyExistsError } from './errors/email-already-exists.error.js';
import { hash } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async signup(body: SignupDto) {
    const userAlreadyExists = await this.userRepository.findByEmail(body.email);

    if (userAlreadyExists) throw new EmailAlreadyExistsError();

    const hashedPassword = await hash(body.password, 10);

    const createdUser = await this.userRepository.create({
      ...body,
      password: hashedPassword,
    });

    return createdUser;
  }
}
