-- =============================================================================
-- V6 - Tabela solicitacoes
-- =============================================================================

CREATE TABLE solicitacoes (
    id                UUID                   NOT NULL DEFAULT gen_random_uuid(),
    codigo            BIGINT                 GENERATED ALWAYS AS IDENTITY,
    titulo            VARCHAR(150)           NOT NULL,
    descricao         TEXT                   NOT NULL,
    nome_solicitante  VARCHAR(120)           NOT NULL,
    area_id           INT                    NOT NULL,
    area_complemento  VARCHAR(100),
    prioridade        prioridade_solicitacao NOT NULL,
    status            status_solicitacao     NOT NULL DEFAULT 'ABERTA',
    data_solicitacao  DATE                   NOT NULL DEFAULT CURRENT_DATE,
    criado_por_id     UUID,
    criado_em         TIMESTAMPTZ            NOT NULL DEFAULT now(),
    atualizado_em     TIMESTAMPTZ            NOT NULL DEFAULT now(),
    excluido_em       TIMESTAMPTZ,

    CONSTRAINT pk_solicitacoes PRIMARY KEY (id),
    CONSTRAINT uk_solicitacoes_codigo UNIQUE (codigo),
    CONSTRAINT fk_solicitacoes_area FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_solicitacoes_criado_por FOREIGN KEY (criado_por_id) REFERENCES usuarios (id) ON DELETE SET NULL
);

CREATE TRIGGER trg_solicitacoes_atualizado_em
    BEFORE UPDATE ON solicitacoes
    FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();
