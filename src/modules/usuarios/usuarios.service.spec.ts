import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UsuariosService } from './usuarios.service.js';

describe('UsuariosService', () => {
  const prisma = {
    usuario: { findUnique: vi.fn(), create: vi.fn() },
  };
  let service: UsuariosService;

  const dto = {
    nome: 'Maria Souza',
    email: 'maria@empresa.com',
    senha: 'Senha@123',
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(UsuariosService);
  });

  it('cria o usuário guardando a senha como hash bcrypt', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'id-1', nome: data.nome, email: data.email }),
    );

    await service.criar(dto);

    const { data, select } = prisma.usuario.create.mock.calls[0][0];
    expect(data.senhaHash).not.toBe(dto.senha);
    await expect(compare(dto.senha, data.senhaHash)).resolves.toBe(true);
    expect(data).not.toHaveProperty('perfil');
    expect(select).not.toHaveProperty('senhaHash');
  });

  it('responde 409 quando o e-mail já está cadastrado', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: 'existente' });

    await expect(service.criar(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.usuario.create).not.toHaveBeenCalled();
  });

  it('responde 409 quando outro cadastro com o mesmo e-mail ganha a corrida', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.criar(dto)).rejects.toBeInstanceOf(ConflictException);
  });
});
