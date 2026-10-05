import { PartialType } from '@nestjs/swagger';
import { CriarSolicitacaoDto } from './criar-solicitacao.dto.js';

export class AtualizarSolicitacaoDto extends PartialType(CriarSolicitacaoDto) {}
