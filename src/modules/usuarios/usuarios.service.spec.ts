import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import { UsuariosRepository } from './usuarios.repository.js';
import { UsuariosService } from './usuarios.service.js';

describe('UsuariosService', () => {
  const repositorio = {
    criar: vi.fn(),
    existe: vi.fn(),
    alterarPerfil: vi.fn(),
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
        { provide: UsuariosRepository, useValue: repositorio },
      ],
    }).compile();

    service = moduleRef.get(UsuariosService);
  });

  it('cria o usuário guardando a senha como hash bcrypt', async () => {
    repositorio.criar.mockResolvedValue({ id: 'id-1', nome: dto.nome });

    await service.criar(dto);

    const [dados] = repositorio.criar.mock.calls[0];
    expect(dados).not.toHaveProperty('senha');
    expect(dados).not.toHaveProperty('perfil');
    await expect(compare(dto.senha, dados.senhaHash)).resolves.toBe(true);
  });

  it('responde 409 quando o e-mail já está cadastrado', async () => {
    repositorio.criar.mockResolvedValue(null);

    await expect(service.criar(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('o administrador não altera o próprio perfil', async () => {
    await expect(
      service.alterarPerfil('u-1', 'SOLICITANTE', 'u-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repositorio.alterarPerfil).not.toHaveBeenCalled();
  });

  it('usuário inexistente: 404', async () => {
    repositorio.existe.mockResolvedValue(false);

    await expect(
      service.alterarPerfil('u-x', 'ANALISTA', 'u-admin'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
