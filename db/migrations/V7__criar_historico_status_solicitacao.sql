-- =============================================================================
-- V7 - Tabela historico_status_solicitacao
-- =============================================================================

CREATE TABLE historico_status_solicitacao (
    id               UUID               NOT NULL DEFAULT gen_random_uuid(),
    solicitacao_id   UUID               NOT NULL,
    status_anterior  status_solicitacao,
    status_novo      status_solicitacao NOT NULL,
    comentario       TEXT,
    alterado_por_id  UUID,
    alterado_em      TIMESTAMPTZ        NOT NULL DEFAULT now(),

    CONSTRAINT pk_historico_status_solicitacao PRIMARY KEY (id),
    CONSTRAINT fk_historico_solicitacao FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_historico_alterado_por FOREIGN KEY (alterado_por_id) REFERENCES usuarios (id) ON DELETE SET NULL

);
