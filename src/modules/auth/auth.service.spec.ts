import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import type { UsuariosRepository } from '../usuarios/usuarios.repository.js';
import { AuthService } from './auth.service.js';
import { ErroLoginGoogle } from './google/erro-login-google.js';

describe('AuthService', () => {
  const usuarios = {
    buscarParaLogin: vi.fn(),
    buscarAtivoPorId: vi.fn(),
    buscarContaPorGoogleId: vi.fn(),
    buscarContaPorEmail: vi.fn(),
    vincularGoogle: vi.fn(),
    criarComGoogle: vi.fn(),
  };
  const jwt = new JwtService({
    secret: 'segredo-de-teste',
    signOptions: { expiresIn: '8h' },
  });
  const service = new AuthService(
    usuarios as unknown as UsuariosRepository,
    jwt,
  );

  const usuario = {
    id: 'u-1',
    nome: 'Maria',
    email: 'maria@empresa.com',
    perfil: 'SOLICITANTE' as const,
    criadoEm: new Date(),
  };
  let senhaHash: string;

  beforeAll(async () => {
    senhaHash = await hash('Senha@123', 4);
  });

  beforeEach(() => vi.resetAllMocks());

  async function motivoGoogle(promessa: Promise<unknown>) {
    const erro = await promessa.catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroLoginGoogle);
    return (erro as ErroLoginGoogle).motivo;
  }

  describe('login', () => {
    it('com e-mail e senha certos, devolve o usuário e um token de 8h', async () => {
      usuarios.buscarParaLogin.mockResolvedValue({
        ...usuario,
        senhaHash,
        ativo: true,
      });

      const sessao = await service.login({
        email: usuario.email,
        senha: 'Senha@123',
      });

      expect(sessao.usuario).toEqual(usuario);
      expect(await jwt.verifyAsync(sessao.token)).toMatchObject({
        sub: 'u-1',
        perfil: 'SOLICITANTE',
      });
      const horas = (sessao.expiraEm.getTime() - Date.now()) / 3_600_000;
      expect(horas).toBeCloseTo(8, 1);
    });

    it.each([
      ['senha errada', { senhaHash, ativo: true }, 'Outra@123'],
      ['usuário inativo', { senhaHash, ativo: false }, 'Senha@123'],
    ])('%s: 401', async (_caso, conta, senha) => {
      usuarios.buscarParaLogin.mockResolvedValue({ ...usuario, ...conta });

      await expect(
        service.login({ email: usuario.email, senha }),
      ).rejects.toThrow('E-mail ou senha inválidos.');
    });

    it('e-mail inexistente: 401 com a mesma mensagem (não revela se o e-mail existe)', async () => {
      usuarios.buscarParaLogin.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nao@existe.com', senha: 'Senha@123' }),
      ).rejects.toThrow('E-mail ou senha inválidos.');
    });
  });

  it('usuarioLogado: sessão de usuário inexistente ou inativo é 401', async () => {
    usuarios.buscarAtivoPorId.mockResolvedValue(null);

    await expect(service.usuarioLogado('u-x')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  describe('entrarComGoogle', () => {
    const perfil = {
      googleId: 'g-1',
      email: ' Maria@Empresa.COM ',
      emailVerificado: true,
      nome: 'Maria Souza',
    };
    const conta = { ...usuario, ativo: true, googleId: 'g-1' };

    it('conta já vinculada ao Google: entra direto', async () => {
      usuarios.buscarContaPorGoogleId.mockResolvedValue(conta);

      const sessao = await service.entrarComGoogle(perfil);

      expect(sessao.usuario).toEqual(usuario);
      expect(usuarios.criarComGoogle).not.toHaveBeenCalled();
    });

    it('conta inativa: usuario_inativo', async () => {
      usuarios.buscarContaPorGoogleId.mockResolvedValue({
        ...conta,
        ativo: false,
      });

      expect(await motivoGoogle(service.entrarComGoogle(perfil))).toBe(
        'usuario_inativo',
      );
    });

    it('e-mail não verificado no Google: email_nao_verificado', async () => {
      usuarios.buscarContaPorGoogleId.mockResolvedValue(null);

      expect(
        await motivoGoogle(
          service.entrarComGoogle({ ...perfil, emailVerificado: false }),
        ),
      ).toBe('email_nao_verificado');
    });

    it('e-mail já ligado a outra conta Google: email_vinculado_a_outra_conta', async () => {
      usuarios.buscarContaPorGoogleId.mockResolvedValue(null);
      usuarios.buscarContaPorEmail.mockResolvedValue({
        ...conta,
        googleId: 'g-outro',
      });

      expect(await motivoGoogle(service.entrarComGoogle(perfil))).toBe(
        'email_vinculado_a_outra_conta',
      );
    });

    it('conta com o mesmo e-mail e sem Google: vincula', async () => {
      usuarios.buscarContaPorGoogleId.mockResolvedValue(null);
      usuarios.buscarContaPorEmail.mockResolvedValue({
        ...conta,
        googleId: null,
      });
      usuarios.vincularGoogle.mockResolvedValue(conta);

      await service.entrarComGoogle(perfil);

      expect(usuarios.buscarContaPorEmail).toHaveBeenCalledWith(
        'maria@empresa.com',
      );
      expect(usuarios.vincularGoogle).toHaveBeenCalledWith('u-1', 'g-1');
    });

    it('primeiro acesso: cria o usuário (sem nome no Google, usa o início do e-mail)', async () => {
      usuarios.buscarContaPorGoogleId.mockResolvedValue(null);
      usuarios.buscarContaPorEmail.mockResolvedValue(null);
      usuarios.criarComGoogle.mockResolvedValue(conta);

      await service.entrarComGoogle({ ...perfil, nome: '  ' });

      expect(usuarios.criarComGoogle).toHaveBeenCalledWith({
        nome: 'maria',
        email: 'maria@empresa.com',
        googleId: 'g-1',
      });
    });
  });
});
