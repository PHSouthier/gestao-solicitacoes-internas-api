-- =============================================================================
-- V5 - Áreas iniciais
-- =============================================================================

INSERT INTO areas (nome) VALUES
    ('Administrativo'),
    ('Comercial'),
    ('Compras'),
    ('Financeiro'),
    ('Jurídico'),
    ('Marketing'),
    ('Operações'),
    ('Recursos Humanos'),
    ('Tecnologia da Informação');

INSERT INTO areas (nome, exige_complemento) VALUES ('Outras', TRUE);
