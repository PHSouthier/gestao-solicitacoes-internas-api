-- =============================================================================
-- V8 - Login com Google: senha opcional e vínculo com a conta Google
-- =============================================================================

ALTER TABLE usuarios ALTER COLUMN senha_hash DROP NOT NULL;

ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255);

ALTER TABLE usuarios ADD CONSTRAINT uk_usuarios_google_id UNIQUE (google_id);

ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_forma_de_login
    CHECK (senha_hash IS NOT NULL OR google_id IS NOT NULL);
