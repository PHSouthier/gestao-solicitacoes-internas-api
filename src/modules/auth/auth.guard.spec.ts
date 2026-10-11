import {
  type ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Perfis, Public } from './auth.decorators.js';
import { AuthGuard } from './auth.guard.js';
import type { RequestAutenticada } from './auth.types.js';

class RotasDeTeste {
  @Public()
  publica() {}

  protegida() {}

  @Perfis('ANALISTA', 'ADMINISTRADOR')
  soAnalista() {}
}

describe('AuthGuard', () => {
  const jwt = new JwtService({ secret: 'segredo-de-teste' });
  const guard = new AuthGuard(jwt, new Reflector());

  function acessar(rota: keyof RotasDeTeste, cookie?: string) {
    const request = {
      cookies: cookie ? { access_token: cookie } : {},
    } as RequestAutenticada;
    const context = {
      getHandler: () => RotasDeTeste.prototype[rota],
      getClass: () => RotasDeTeste,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    return { request, resultado: guard.canActivate(context) };
  }

  const token = (perfil: string) =>
    jwt.signAsync({ sub: 'u-1', perfil }, { expiresIn: '1h' });

  it('rota com @Public() passa sem login', async () => {
    await expect(acessar('publica').resultado).resolves.toBe(true);
  });

  it('sem o cookie de sessão: 401', async () => {
    await expect(acessar('protegida').resultado).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('token inválido: 401', async () => {
    await expect(
      acessar('protegida', 'token-adulterado').resultado,
    ).rejects.toThrow('Sessão inválida ou expirada');
  });

  it('token expirado: 401', async () => {
    const vencido = await jwt.signAsync({
      sub: 'u-1',
      perfil: 'ANALISTA',
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    await expect(
      acessar('protegida', vencido).resultado,
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('token válido: passa e deixa o usuário na requisição', async () => {
    const { request, resultado } = acessar(
      'protegida',
      await token('SOLICITANTE'),
    );

    await expect(resultado).resolves.toBe(true);
    expect(request.usuario).toEqual({ id: 'u-1', perfil: 'SOLICITANTE' });
  });

  it('perfil fora do @Perfis: 403', async () => {
    await expect(
      acessar('soAnalista', await token('SOLICITANTE')).resultado,
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('perfil dentro do @Perfis: passa', async () => {
    await expect(
      acessar('soAnalista', await token('ANALISTA')).resultado,
    ).resolves.toBe(true);
  });
});
