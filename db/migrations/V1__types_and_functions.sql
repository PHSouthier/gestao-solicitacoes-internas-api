-- =============================================================================
-- V1 - Tipos enumerados e funções utilitárias
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums de domínio
-- -----------------------------------------------------------------------------
CREATE TYPE perfil_usuario AS ENUM ('SOLICITANTE', 'ANALISTA', 'ADMINISTRADOR');
COMMENT ON TYPE perfil_usuario IS 'Perfil do usuário: Solicitante, Analista, Administrador';

CREATE TYPE status_solicitacao AS ENUM ('ABERTA', 'EM_ANALISE', 'APROVADA', 'REJEITADA');
COMMENT ON TYPE status_solicitacao IS 'Status da solicitação: Aberta, Em Análise, Aprovada, Rejeitada';

CREATE TYPE prioridade_solicitacao AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
COMMENT ON TYPE prioridade_solicitacao IS 'Prioridade da solicitação: Baixa, Média, Alta';

-- -----------------------------------------------------------------------------
-- set_updated_at(): função de trigger que mantém a coluna updated_at no próprio banco.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;
