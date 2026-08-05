# Novo fluxo — planejamento (não implementado)

Esta pasta reúne todo o material de planejamento do "novo fluxo" (submissão revisável, questionário pedagógico, aprovação/regeneração de feedback). Nenhum destes documentos tem código correspondente em `apps/backend`, `apps/frontend` ou `n8n/workflows` ainda — é roadmap, não estado atual.

- `novo-fluxo-usuario.md` — narrativa da experiência do professor no novo fluxo.
- `novo-fluxo-interno.md` — quebra técnica interna (P1–P5) do que precisa ser construído.
- `PLANO_ACAO_NOVO_FLUXO.md` — arquitetura completa e ambiciosa (Postgres, `/api/v2`, feature flags, auditoria).
- `PLANO_IMPLEMENTACAO_MVP_NOVO_FLUXO.md` — subconjunto reduzido do mesmo plano, mantendo o `Map` em memória e sem `/v2`, pensado para validar o questionário + feedback editável com professores antes de qualquer reescrita maior.
- `contratos.md` — contrato de dados consolidado do MVP acima (rotas, JSON de requisição/resposta, nomes canônicos de campo), resolvendo as divergências de nome entre os documentos acima e os prompts em `docs/prompts/`.

O fluxo atualmente em produção está documentado em `docs/arquitetura.md` e `docs/contratos-api.md` e continua sendo o único fluxo implementado.
