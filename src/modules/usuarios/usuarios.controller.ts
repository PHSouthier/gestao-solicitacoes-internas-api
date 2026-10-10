import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  criar(@Body() dto: CriarUsuarioDto): Promise<UsuarioResponseDto> {
    return this.usuariosService.criar(dto);
  }

  /** Lista os usuários ativos (somente administrador). */
  @Get()
  @Perfis('ADMINISTRADOR')
  listar(): Promise<UsuarioResponseDto[]> {
    return this.usuariosService.listar();
  }

  /** Altera o perfil de um usuário (somente administrador, e não o próprio). */
  @Patch(':id/perfil')
  @Perfis('ADMINISTRADOR')
  alterarPerfil(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AlterarPerfilDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.alterarPerfil(id, dto.perfil, usuario.id);
  }
}
