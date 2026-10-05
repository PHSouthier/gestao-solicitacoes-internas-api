-- =============================================================================
-- Seed de desenvolvimento (migration repeatable do Flyway)
-- Usuários de teste, todos com a senha: Senha@123
-- =============================================================================

INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
    ('Administrador',      'admin@empresa.local',       '$2b$10$nTJNbfi2ECWxYGsBQ11e.eemW/D1FB52Y9co32WiXR5asRFO6QgTu', 'ADMINISTRADOR'),
    ('Ana Analista',       'analista@empresa.local',    '$2b$10$nTJNbfi2ECWxYGsBQ11e.eemW/D1FB52Y9co32WiXR5asRFO6QgTu', 'ANALISTA'),
    ('Sérgio Solicitante', 'solicitante@empresa.local', '$2b$10$nTJNbfi2ECWxYGsBQ11e.eemW/D1FB52Y9co32WiXR5asRFO6QgTu', 'SOLICITANTE');
