-- =============================================================================
-- V3 - Tabela usuarios
-- =============================================================================

CREATE TABLE usuarios (
    id             UUID           NOT NULL DEFAULT gen_random_uuid(),
    nome           VARCHAR(120)   NOT NULL,
    email          VARCHAR(254)   NOT NULL,
    senha_hash     VARCHAR(255)   NOT NULL,
    perfil         perfil_usuario NOT NULL DEFAULT 'SOLICITANTE',
    ativo          BOOLEAN        NOT NULL DEFAULT TRUE,
    criado_em      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    atualizado_em  TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uk_usuarios_email UNIQUE (email),
    CONSTRAINT ck_usuarios_email_minusculo CHECK (email = lower(btrim(email)))
);

CREATE TRIGGER trg_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();
