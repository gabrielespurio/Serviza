import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

export class AuthService {
  async register(data: any) {
    const { name, email, password, role, companyName, document, skills, description } = data;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new Error('E-mail já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
        },
      });

      if (role === 'CONTRATANTE') {
        await tx.contratanteProfile.create({
          data: {
            userId: user.id,
            companyName,
            document,
          },
        });
      } else if (role === 'PRESTADOR') {
        await tx.prestadorProfile.create({
          data: {
            userId: user.id,
            skills: skills || [],
            description,
          },
        });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: '7d',
      });

      return { user, token };
    });
  }

  async login(data: any) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Senha incorreta.');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return { user, token };
  }

  async checkEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    return !!user;
  }
}
