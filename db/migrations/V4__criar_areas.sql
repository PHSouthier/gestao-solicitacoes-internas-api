-- =============================================================================
-- V4 - Tabela areas (áreas solicitantes)
-- =============================================================================

CREATE TABLE areas (
    id                 INT          GENERATED ALWAYS AS IDENTITY,
    nome               VARCHAR(100) NOT NULL,
    exige_complemento  BOOLEAN      NOT NULL DEFAULT FALSE,
    ativo              BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_areas PRIMARY KEY (id),
    CONSTRAINT uk_areas_nome UNIQUE (nome)
);

COMMENT ON COLUMN areas.exige_complemento IS 'TRUE na área "Outras": a solicitação deve informar o nome da área em area_complemento';

CREATE TRIGGER trg_areas_atualizado_em
    BEFORE UPDATE ON areas
    FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();
