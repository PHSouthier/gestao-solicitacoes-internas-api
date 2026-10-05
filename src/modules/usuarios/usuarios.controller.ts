import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
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
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  criar(@Body() dto: CriarUsuarioDto): Promise<UsuarioResponseDto> {
    return this.usuariosService.criar(dto);
  }
}
