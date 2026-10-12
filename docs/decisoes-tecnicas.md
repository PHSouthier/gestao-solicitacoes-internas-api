# 💡 Decisões técnicas

[⬅️ Voltar ao README](../README.md)

## Arquitetura e organização

| Decisão | Por quê |
|---|---|
| **Dois repositórios** (API e web) | Cada parte evolui, é versionada e publicada de forma independente |
| **Camadas controller → service → repository** em todos os módulos | Responsabilidades separadas, o mesmo padrão em todo o projeto, regras testáveis sem banco |
| **Mapper separado** nas solicitações | A forma da resposta da API não fica presa à forma da tabela |
| **Máquina de estados numa função pura** (`status.policy.ts`) | A regra mais importante do domínio fica num lugar só, fácil de ler e de testar |
| **Configuração por variáveis de ambiente** | Nada de chaves no código |

## Banco de dados

| Decisão | Por quê |
|---|---|
| **Flyway como fonte do schema** e Prisma só como cliente | SQL explícito e versionado, revisável e com histórico; o Prisma lê o banco e gera os tipos |
| **Seed separado das migrations** | Os usuários de teste entram só quando a pasta do seed está no `FLYWAY_LOCATIONS`; um ambiente real sobe sem eles |
| **Exclusão lógica** | Preserva histórico e auditoria |
| **Paginação obrigatória**, com no máximo 100 itens por página | Nenhuma consulta devolve a tabela inteira, mesmo com muitos registros |

## Segurança

| Decisão | Por quê |
|---|---|
| **JWT em cookie `httpOnly`** | O JavaScript do navegador não lê o token e a API não guarda sessão, então pode ter várias instâncias |
| **Guard global** com `@Public()` e `@Perfis()` | Toda rota nasce protegida |
| **Senhas com *hash* bcrypt** | A senha nunca é guardada nem pode ser recuperada a partir do banco |
| **Validação global com DTOs** | Dado inválido para antes de chegar ao service, e não é possível enviar campos que a rota não espera |

## API e documentação

| Decisão | Por quê |
|---|---|
| **API versionada na URL** (`/api/v1`) | Uma mudança incompatível pode virar `/v2` sem quebrar o front atual |
| **Documentação com Swagger** | Mostra todas as rotas, os dados de entrada e saída e os erros de cada uma, e permite testar pelo navegador em `/api/docs` |
| **Swagger gerado a partir do código** | A documentação sai dos DTOs e controllers, então acompanha o código e não fica desatualizada |
| **Login com Google opcional** | Alternativa ao e-mail e senha |
| **Exceções nativas do Nest + filtro global** | Um jeito só de lançar erro; o filtro garante o mesmo JSON em toda a API e esconde detalhes de erros inesperados |

## Qualidade e infraestrutura

| Decisão | Por quê |
|---|---|
| **Testes unitários (Vitest) sem banco** na API | Cobrem as regras de negócio e de segurança, que é onde estão os riscos |
| **Testes ponta a ponta só no front** (Playwright) | Um único conjunto cobre o fluxo inteiro (navegador → front → API → banco), sem duplicar testes de integração na API |
| **Docker Compose com healthchecks e ordem de subida** | Banco → migrations → API → front: cada serviço só sobe quando o anterior está pronto |

## Veja também

- [Premissas e regras de negócio](premissas-e-regras-de-negocio.md): as regras que essas decisões implementam.
- [Status da entrega](status-da-entrega.md): o que foi implementado e o que ficou pendente.
