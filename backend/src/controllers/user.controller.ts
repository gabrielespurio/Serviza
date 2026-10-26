import { Request, Response } from 'express';
import { supabase } from '../services/supabase.service';
import { prisma } from '../prisma';

export class UserController {
  async uploadAvatar(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      }

      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload para o Supabase Storage (bucket "avatars")
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Atualizar o usuário no banco
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
        select: { id: true, name: true, avatarUrl: true, role: true }
      });

      return res.status(200).json(updatedUser);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          contratante: true,
          prestador: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      // Remover o hash da senha
      const { passwordHash, ...safeUser } = user;
      return res.status(200).json(safeUser);

    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao buscar perfil.' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado.' });
      }

      const { name, document, companyName, skills, description } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          contratante: true,
          prestador: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      if (name) {
        await prisma.user.update({
          where: { id: userId },
          data: { name }
        });
      }

      if (user.role === 'CONTRATANTE') {
        await prisma.contratanteProfile.upsert({
          where: { userId },
          create: {
            userId,
            document: document || null,
            companyName: companyName || null,
          },
          update: {
            ...(document !== undefined ? { document } : {}),
            ...(companyName !== undefined ? { companyName } : {}),
          }
        });
      } else if (user.role === 'PRESTADOR') {
        await prisma.prestadorProfile.upsert({
          where: { userId },
          create: {
            userId,
            skills: skills || [],
            description: description || null,
          },
          update: {
            ...(skills ? { skills } : {}),
            ...(description !== undefined ? { description } : {}),
          }
        });
      }

      const updated = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          contratante: true,
          prestador: true
        }
      });

      if (!updated) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const { passwordHash, ...safeUser } = updated;
      return res.status(200).json(safeUser);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
  }
}
