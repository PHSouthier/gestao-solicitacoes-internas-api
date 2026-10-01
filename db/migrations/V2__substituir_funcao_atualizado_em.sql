-- =============================================================================
-- V2 - Substitui set_updated_at() por definir_atualizado_em()
-- =============================================================================

CREATE OR REPLACE FUNCTION definir_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em := now();
    RETURN NEW;
END;
$$;

DROP FUNCTION set_updated_at();
