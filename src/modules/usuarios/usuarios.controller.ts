import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import { Perfis } from '../auth/perfis.decorator.js';
import { UsuarioAtual } from '../auth/usuario-atual.decorator.js';
import { AlterarPerfilDto } from './dto/alterar-perfil.dto.js';
import { CriarUsuarioDto } from './dto/criar-usuario.dto.js';
import { UsuarioResponseDto } from './dto/usuario-response.dto.js';
import { UsuariosService } from './usuarios.service.js';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Cadastra um usuário com e-mail e senha' })
  @ApiCreatedResponse({ type: UsuarioResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Dados inválidos',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'E-mail já cadastrado',
  })
  criar(@Body() dto: CriarUsuarioDto): Promise<UsuarioResponseDto> {
    return this.usuariosService.criar(dto);
  }

  @Get()
  @Perfis('ADMINISTRADOR')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Lista os usuários ativos (somente administrador)' })
  @ApiOkResponse({ type: [UsuarioResponseDto] })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Sem permissão',
  })
  listar(): Promise<UsuarioResponseDto[]> {
    return this.usuariosService.listar();
  }

  @Patch(':id/perfil')
  @Perfis('ADMINISTRADOR')
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Altera o perfil de um usuário (somente administrador)',
  })
  @ApiOkResponse({ type: UsuarioResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Perfil inválido',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Sem permissão',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Usuário não encontrado',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Tentativa de alterar o próprio perfil',
  })
  alterarPerfil(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AlterarPerfilDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.alterarPerfil(id, dto.perfil, usuario.id);
  }
}
