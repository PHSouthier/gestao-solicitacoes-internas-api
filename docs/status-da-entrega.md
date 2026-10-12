# 🚀 Status da entrega

[⬅️ Voltar ao README](../README.md)

## Implementado

- Cadastro, consulta (uma e várias), edição e exclusão de solicitações.
- Listagem com busca, filtros (status, prioridade, área, período), ordenação e paginação.
- Análise e decisão com comentário, autor e data, e histórico completo de status.
- Dashboard com total, contagem por status, por prioridade e por área, e taxa de aprovação.
- Autenticação (e-mail e senha, e Google opcional) e autorização por perfil.
- Validação em todas as entradas, formato único de erro e Swagger completo, com os erros de cada rota.
- Migrations versionadas, seed, Docker Compose com healthchecks e os dois serviços containerizados.
- Testes unitários na API e testes ponta a ponta (Playwright) no front.

## Pendente

O que ficou de fora e como seria implementado:

- **Integração com sistema externo:** proposta descrita nas [considerações arquiteturais](../README.md#-considera%C3%A7%C3%B5es-arquiteturais) do README (mensageria, retry e DLQ).
- **Logs estruturados (JSON):** hoje os logs são os do Nest, em texto. Seria usado o `nestjs-pino`, com o `requestId` em todas as linhas.
- **Limite de tentativas no login:** usar o `@nestjs/throttler` na rota de login (por exemplo, 5 tentativas por minuto por IP).
- **CI:** GitHub Actions rodando testes e build a cada push nos dois repositórios.

## Critérios de priorização do projeto

1. **Primeiro, o essencial:** cadastro, consulta, análise, decisão, dashboard, API REST, Docker e documentação.
2. **Depois, qualidade:** validação, tratamento de erros, separação em camadas, testes das regras e da segurança.
3. **Por último, diferenciais**, na ordem do que mais protege o sistema: autenticação e perfis, testes ponta a ponta e documentação da API.

## Próximos passos

1. Logs estruturados e limite de tentativas no login.
2. CI.
3. Integração com sistema externo.
4. Notificações por e-mail quando uma solicitação for decidida.
5. Anexos e comentários nas solicitações.

## Veja também

- [Premissas e regras de negócio](premissas-e-regras-de-negocio.md): o fluxo de status, as regras e as permissões implementadas.
- [Decisões técnicas](decisoes-tecnicas.md): o que foi escolhido e por quê.
