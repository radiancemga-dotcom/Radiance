# Radiance Laser — Sistema de Locação de Laser Médico

Sistema web completo (SaaS) para a **Radiance Laser** (Maringá-PR): locação do **Laser Duoglide** para médicos e clínicas, com landing page institucional, autenticação, reservas online com logística automática por distância, painel administrativo, financeiro e notificações.

> **Modo demonstração incluído.** Sem credenciais do Supabase, o sistema roda 100% no navegador (dados em `localStorage`), permitindo navegar por tudo imediatamente. Ao configurar o Supabase, ele passa a usar backend real, RLS, e login com Google — sem mudar uma linha de código.

---

## 🚀 Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 6, TailwindCSS, shadcn/UI (Radix), React Router 6, React Query 5, React Hook Form, Zod, FullCalendar, Recharts, Lucide |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Geolocalização | OpenStreetMap (Nominatim/OSRM) + ViaCEP — gratuito, sem chave (trocável para Google Maps) |
| Exportação | SheetJS (Excel) + jsPDF (PDF) |
| Hospedagem | Netlify |

---

## ✅ Pré-requisitos

- Node.js 20+ e npm
- (Opcional, para produção) Conta no [Supabase](https://supabase.com) e no [Netlify](https://netlify.com)

---

## 📦 1. Instalação e execução (modo demo)

```bash
npm install
cp .env.example .env      # no Windows (PowerShell): Copy-Item .env.example .env
npm run dev
```

Acesse **http://localhost:5183**.

### Contas de teste (modo demo)
| Perfil | E-mail | Senha |
| --- | --- | --- |
| Cliente | `cliente@demo.com` | `demo123` |
| Administrador | `admin@radiancelaser.com.br` | `admin123` |

> O modo demo persiste os dados no `localStorage` do navegador. Para reiniciar os dados, limpe o armazenamento do site ou rode `resetMockDb()` (exportado em `src/data/mockBackend.ts`).

Scripts disponíveis:
```bash
npm run dev        # servidor de desenvolvimento (porta 5183)
npm run build      # typecheck + build de produção (gera dist/)
npm run preview    # serve o build de produção localmente
npm run typecheck  # apenas checagem de tipos
```

---

## 🗄️ 2. Configuração do Supabase (produção)

### 2.1 Criar o projeto e o schema
1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, rode **em ordem**:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — tabelas, ENUMs, índices, **triggers**, **funções**, **políticas RLS** e **seeds** (settings + cidades).
   - [`supabase/migrations/0002_availability.sql`](supabase/migrations/0002_availability.sql) — função `get_availability()` usada pelo calendário de disponibilidade.
   - [`supabase/migrations/0003_blocks_reviews.sql`](supabase/migrations/0003_blocks_reviews.sql) — tabelas `schedule_blocks` (bloqueios do admin) e `reviews` (avaliações), com RLS e atualização do `get_availability()`.
   - [`supabase/migrations/0004_equipment_coupons.sql`](supabase/migrations/0004_equipment_coupons.sql) — tabelas `equipment` e `coupons`, novas colunas de equipamento/cupom/pagamento em `reservations` e `get_availability(p_equipment)` por equipamento.
3. Em **Project Settings → API**, copie a `Project URL` e a `anon public key`.

### 2.2 Conectar o frontend
No arquivo `.env`:
```env
VITE_USE_MOCK=false
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```
Reinicie o `npm run dev`. O sistema passa automaticamente do modo demo para o Supabase.

### 2.3 Tornar um usuário administrador
Cadastre-se normalmente pela tela de cadastro. Depois, no SQL Editor:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'seu-email@dominio.com');
```

### 2.4 Login com Google (opcional)
1. No Google Cloud Console, crie um **OAuth Client ID** (tipo Web).
2. Em **Authentication → Providers → Google** (Supabase), habilite e cole o Client ID e Secret.
3. Adicione a *Redirect URL* informada pelo Supabase no Google Cloud.
4. Pronto — o botão "Entrar com Google" fica ativo automaticamente.

### 2.5 E-mails de notificação (Edge Function)
A função [`supabase/functions/send-notification`](supabase/functions/send-notification/index.ts) envia e-mails via [Resend](https://resend.com).

```bash
# Instale a CLI do Supabase e faça login
supabase login
supabase link --project-ref SEU_PROJECT_REF

# Configure as secrets
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set NOTIFICATION_FROM_EMAIL="Radiance Laser <contato@seudominio.com>"
supabase secrets set ADMIN_NOTIFICATION_EMAIL="admin@seudominio.com"

# Deploy
supabase functions deploy send-notification
```

**Disparo automático por e-mail:** em **Database → Webhooks**, crie um webhook na tabela `notifications` (evento `INSERT`) apontando para a função `send-notification`. Cada notificação gerada (cadastro, reserva criada/aprovada/cancelada/alterada) dispara o e-mail correspondente.

---

### 2.6 Pagamentos com Asaas (opcional)
Fluxo de cobrança Pix/boleto/cartão via [Asaas](https://www.asaas.com).

```bash
# Secrets das Edge Functions
supabase secrets set ASAAS_API_KEY=seu_token_asaas
supabase secrets set ASAAS_ENV=sandbox            # ou "production"
supabase secrets set ASAAS_WEBHOOK_TOKEN=um_token_secreto   # opcional

# Deploy das funções
supabase functions deploy asaas-create-charge
supabase functions deploy asaas-webhook
```

1. No painel do **Asaas → Integrações → Webhooks**, aponte para a URL da função `asaas-webhook` (e use o mesmo `ASAAS_WEBHOOK_TOKEN` no header `asaas-access-token`, se definido).
2. No frontend (`.env` / Netlify), defina `VITE_PAYMENTS_ENABLED=true`.
3. No painel admin, em cada reserva, use **"Gerar cobrança (Asaas)"**. O cliente vê o link **"Pagar agora"** no detalhe da reserva. Ao confirmar o pagamento, o webhook marca a reserva como **paga** e o financeiro como **recebido** automaticamente.

> Enquanto `VITE_PAYMENTS_ENABLED=false` (padrão), toda a UI de pagamento fica oculta e o sistema funciona normalmente sem cobrança.

## 🌐 3. Deploy no Netlify

1. Suba o projeto para um repositório Git (GitHub/GitLab).
2. No Netlify: **Add new site → Import an existing project**.
3. As configurações de build já estão em [`netlify.toml`](netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Redirecionamento SPA já configurado.
4. Em **Site settings → Environment variables**, adicione:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `VITE_USE_MOCK=false`
   - (opcional) `VITE_GEO_PROVIDER`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_COMPANY_*`, `VITE_PAYMENTS_ENABLED`
5. Deploy. Depois, no Supabase, adicione a URL do Netlify em **Authentication → URL Configuration** (Site URL e Redirect URLs).

---

## 🧭 4. Funcionalidades

### Landing page
Hero, Benefícios, Como Funciona, Sobre, Contato, botão flutuante de WhatsApp em todas as páginas.

### Área do cliente (`/app`)
- **Dashboard**: próximas reservas, pendentes, concluídas, histórico.
- **Nova Reserva**: **calendário de disponibilidade** (dias livres/parciais/lotados), período (manhã/tarde/integral — períodos ocupados ficam desabilitados), local (com **autocompletar por CEP**), procedimentos. Calcula **distância de Maringá**, aplica **regras de logística** e detecta **conflitos de agenda** antes de confirmar.
- **Minhas Reservas**: filtro por status; detalhe com histórico de alterações, **reagendamento** (nova data/período com recálculo de valor), **download do comprovante em PDF** e cancelamento.
- **Perfil**: edição dos dados cadastrais.
- **Modo escuro**: alternância de tema clara/escura persistente (disponível em todo o site).

### Painel administrativo (`/admin`)
- **Dashboard**: **seletor de mês**, reservas do mês, receita prevista/realizada, clientes ativos/cadastrados, taxa de ocupação, gráficos e **satisfação dos clientes** (média + avaliações recentes).
- **Agenda**: FullCalendar (mês/semana/dia) com cores por status; clique abre o gerenciamento da reserva. **Bloqueio de datas/períodos** (feriado, manutenção) que indisponibiliza o slot para os clientes.
- **Reservas**: busca/filtro, aprovar, rejeitar, cancelar, alterar data/período/endereço (com histórico), **exportação Excel/PDF** da lista filtrada e **gerar cobrança Asaas** (quando pagamentos habilitados).
- **Equipamentos**: cadastro de múltiplos equipamentos (ativar/desativar); o cliente escolhe o equipamento na reserva e a disponibilidade é calculada **por equipamento**.
- **Cupons**: criação de cupons percentuais ou de valor fixo, com validade e ativação; aplicados pelo cliente na Nova Reserva.
- **Notificações**: página dedicada (cliente e admin) além do sino no topo.
- **Logística**: **relatório PDF** de cidades, distâncias, regras e quilometragem.
- **Clientes**: visualizar, bloquear, reativar, excluir.
- **Logística**: cidades, distância de Maringá, regra aplicada, **sobrescrita manual** da regra, mapa da rota, relatórios de quilometragem (mês/ano) e cidades atendidas.
- **Financeiro**: receita prevista/recebida/a receber, por cidade, por cliente, por mês, **exportação Excel e PDF**.
- **Configurações**: valores de locação, desconto integral, horários, regras de distância, dados da empresa e WhatsApp.

### Regras de logística (a partir de Maringá-PR)
| Distância | Regra |
| --- | --- |
| Até 100 km | Reserva normal por período |
| 101–250 km | Reserva normal por período |
| Acima de 250 km | **Ocupa o dia inteiro** (bloqueia manhã e tarde) |

O administrador pode sobrescrever a regra de qualquer cidade (automática / por período / dia inteiro). Conflitos de agenda são impedidos automaticamente (no frontend e via trigger no banco).

### Preços (configuráveis)
- Meio período: **R$ 2.000,00**
- Integral: 2× meio período − **10%** = **R$ 3.600,00**

---

## 🔐 5. Segurança

- **Row Level Security (RLS)** em todas as tabelas (cliente só vê os próprios dados; admin vê tudo).
- **JWT** gerenciado pelo Supabase Auth.
- **Proteção de rotas** por papel (`RequireAuth`, `RequireAdmin`, `GuestOnly`).
- **Auditoria** de alterações (`audit_logs`) e **histórico** de reservas (`reservation_history`) via triggers.
- **Validação** de formulários com Zod (CPF, e-mail, telefone, etc.).
- Função `prevent_reservation_conflict` impede dupla reserva no mesmo período/dia.

---

## 🏗️ 6. Estrutura do projeto

```
src/
├─ components/
│  ├─ ui/            # shadcn/UI (button, card, dialog, select, tabs, ...)
│  ├─ layout/        # PublicNav, Footer, AppShell, WhatsApp, NotificationBell, Logo
│  ├─ shared/        # StatCard, StatusBadge, EmptyState, Field, loaders
│  └─ admin/         # ManageReservationDialog
├─ data/             # camada de dados (abstração mock ↔ Supabase)
│  ├─ mockBackend.ts # backend demo (localStorage + seeds)
│  ├─ supabaseBackend.ts
│  └─ index.ts       # seleciona o backend conforme o ambiente
├─ hooks/api.ts      # React Query (queries + mutations)
├─ lib/              # geo, logistics, pricing, export, utils, constants, supabase
├─ pages/            # landing, auth, client, admin
├─ providers/        # AuthProvider
├─ routes/           # guards de rota
└─ types/            # tipos de domínio
supabase/
├─ migrations/0001_init.sql
├─ functions/send-notification/
└─ config.toml
```

---

## 🔧 7. Manutenção

- **Trocar o provedor de geolocalização para Google Maps**: no `.env`, defina `VITE_GEO_PROVIDER=google` e `VITE_GOOGLE_MAPS_API_KEY=...`. Nenhuma mudança de código é necessária — `src/lib/geo.ts` já trata os dois provedores.
- **Ajustar preços, horários e regras**: pelo painel **Configurações** (gravado na tabela `settings`).
- **Adicionar cidades e ajustar distâncias**: painel **Logística**.
- **Resetar dados do modo demo**: limpe o `localStorage` do navegador.
- **Migrações futuras do banco**: adicione novos arquivos `supabase/migrations/000X_*.sql` e rode no SQL Editor ou via `supabase db push`.
- **Atualizar dependências**: `npm outdated` e `npm update`; rode `npm run build` para validar.
- **Logs e auditoria**: a tabela `audit_logs` registra ações administrativas; `reservation_history` registra alterações de reservas.

---

## 📄 Licença

Projeto proprietário desenvolvido para a Radiance Laser.
