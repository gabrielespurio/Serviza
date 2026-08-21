import { prisma } from '../prisma';

export class JobService {
  async createJob(userId: string, data: any) {
    const { title, description, price, paymentValue, date } = data;

    // Verificar se o usuário é realmente um CONTRATANTE e buscar seu perfil
    const contratante = await prisma.contratanteProfile.findUnique({
      where: { userId },
    });

    if (!contratante) {
      throw new Error('Apenas contratantes podem criar vagas.');
    }

    const numericPrice = parseFloat(price ?? paymentValue ?? '0');

    const job = await prisma.job.create({
      data: {
        contratanteId: contratante.id,
        title: title || 'Nova Vaga',
        description: description || '',
        price: isNaN(numericPrice) ? 0 : numericPrice,
        date: date ? new Date(date) : new Date(),
      },
    });

    return job;
  }

  async listJobs() {
    // Listar vagas que estão com status OPEN (disponíveis para prestadores)
    const jobs = await prisma.job.findMany({
      where: { status: 'OPEN' },
      include: {
        contratante: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return jobs;
  }

  async listMyJobs(userId: string) {
    const contratante = await prisma.contratanteProfile.findUnique({
      where: { userId },
    });

    if (!contratante) {
      return [];
    }

    const jobs = await prisma.job.findMany({
      where: { contratanteId: contratante.id },
      include: {
        contratante: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return jobs;
  }
}
