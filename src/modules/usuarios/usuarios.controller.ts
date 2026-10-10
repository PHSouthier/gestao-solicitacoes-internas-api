import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiErros } from '../../common/decorators/api-erros.decorator.js';
import { IdParamDto } from '../../common/dto/id-param.dto.js';
import { Perfis, Public, UsuarioAtual } from '../auth/auth.decorators.js';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import { AlterarPerfilDto } from './dto/alterar-perfil.dto.js';
import { CriarUsuarioDto } from './dto/criar-usuario.dto.js';
import { UsuarioResponseDto } from './dto/usuario-response.dto.js';
import { UsuariosService } from './usuarios.service.js';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /** Cadastra um usuário com e-mail e senha (perfil Solicitante). */
  @Public()
  @Post()
  @ApiErros(400, { 409: 'E-mail já cadastrado' })
  criar(@Body() dto: CriarUsuarioDto): Promise<UsuarioResponseDto> {
    return this.usuariosService.criar(dto);
  }

  /** Lista os usuários ativos (somente administrador). */
  @Get()
  @Perfis('ADMINISTRADOR')
  @ApiErros(401, { 403: 'Somente administrador' })
  listar(): Promise<UsuarioResponseDto[]> {
    return this.usuariosService.listar();
  }

  /** Altera o perfil de um usuário (somente administrador, e não o próprio). */
  @Patch(':id/perfil')
  @Perfis('ADMINISTRADOR')
  @ApiErros(401, {
    400: 'Perfil inválido',
    403: 'Somente administrador',
    404: 'Usuário não encontrado',
    409: 'Tentativa de alterar o próprio perfil',
  })
  alterarPerfil(
    @Param() { id }: IdParamDto,
    @Body() dto: AlterarPerfilDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.alterarPerfil(id, dto.perfil, usuario.id);
  }
}
