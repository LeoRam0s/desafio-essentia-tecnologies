# Desafio Essentia Technologies

Aplicação full stack de gerenciamento de tarefas desenvolvida para o desafio técnico da Essentia Technologies.

O projeto possui frontend em Angular, API REST em NestJS e utiliza MySQL, MongoDB e Redis.

## Stack

### Frontend

- Angular 19
- TypeScript
- RxJS
- SCSS

### Backend

- Node.js 24
- NestJS 12
- TypeScript
- Prisma 7
- Mongoose
- JWT
- Swagger
- Vitest

### Infraestrutura

- MySQL 8.4
- MongoDB 8
- Redis
- Docker
- Docker Compose

## Pré-requisitos

Para executar todo o projeto via Docker:

- Git
- Docker
- Docker Compose

Para desenvolvimento local:

- Node.js 24
- npm
- Docker e Docker Compose para subir MySQL, MongoDB e Redis

## Variáveis de ambiente

O projeto possui dois arquivos de exemplo de ambiente.

### Docker Compose

Na raiz do projeto:

```bash
cp .env.example .env
```

Esse arquivo utiliza os nomes dos serviços Docker como hosts:

```text
mysql
mongo
redis
```

### Backend local

Dentro de `backend/`:

```bash
cd backend
cp .env.example .env
```

Nesse caso, os serviços de infraestrutura são acessados via `localhost`.

## Execução com Docker

Na raiz do projeto:

```bash
cp .env.example .env
docker compose --env-file .env up --build -d
```

O Docker Compose sobe:

- MySQL
- MongoDB
- Redis
- Backend
- Frontend

Durante a inicialização do backend, as migrations do Prisma são aplicadas automaticamente antes da aplicação ser iniciada:

```bash
prisma migrate deploy --config prisma7.config.ts
```

Depois, o backend é executado através do build gerado:

```bash
node dist/main.js
```

### URLs

Após a inicialização:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs` (Se `NODE_ENV=development`)

### Parar os containers

```bash
docker compose --env-file .env down
```

Os dados do MySQL e MongoDB são persistidos em volumes Docker.

### Observação sobre produção

O backend é compilado durante o build da imagem Docker e executado a partir de `dist/main.js`.

O frontend, no estado atual do projeto, é executado dentro do container através de `ng serve`. Portanto, o Docker Compose atual representa uma execução completa e containerizada da aplicação, mas ainda não utiliza um servidor de arquivos estáticos para servir o build de produção do Angular.

## Desenvolvimento local

A ordem recomendada é:

1. Subir MySQL, MongoDB e Redis.
2. Preparar o banco MySQL com Prisma.
3. Iniciar o backend.
4. Iniciar o frontend.

### 1. Backend

Entre na pasta:

```bash
cd backend
```

Crie o `.env`:

```bash
cp .env.example .env
```

Instale as dependências:

```bash
npm ci
```

Suba os serviços de infraestrutura:

```bash
npm run db:up
```

Execute as migrations e gere o Prisma Client:

```bash
npm run db:migrate
```

Inicie o backend em modo de desenvolvimento:

```bash
npm run start:dev
```

O backend ficará disponível em:

```text
http://localhost:3000
```

A documentação Swagger estará disponível em (se `NODE_ENV=development`):

```text
http://localhost:3000/api/docs
```

### Scripts do backend

| Script | Descrição |
| --- | --- |
| `npm run build` | Compila a aplicação NestJS. |
| `npm run start` | Inicia a aplicação NestJS. |
| `npm run start:dev` | Inicia o backend em modo development com watch. |
| `npm run start:debug` | Inicia em modo debug com watch. |
| `npm run start:prod` | Executa o build através de `node dist/main`. |
| `npm run db:up` | Sobe MySQL, MongoDB e Redis pelo Docker Compose. |
| `npm run db:down` | Para MySQL, MongoDB e Redis. |
| `npm run db:migrate` | Executa `prisma migrate dev` e `prisma generate`. |
| `npm run db:test:up` | Sobe MySQL e MongoDB utilizados pelos testes E2E. |
| `npm run db:test:down` | Remove os serviços de banco utilizados pelos testes E2E. |
| `npm run db:test:migrate` | Aplica as migrations no banco utilizado pelos testes. |
| `npm run test:unit` | Executa os testes unitários com Vitest. |
| `npm run test:e2e` | Prepara os bancos e executa os testes E2E. |

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm ci
npm start
```

O frontend ficará disponível em:

```text
http://localhost:4200
```

Durante o desenvolvimento, requisições para:

```text
/api/*
```

são encaminhadas para:

```text
http://127.0.0.1:3000
```

O prefixo `/api` é removido antes da requisição chegar ao backend.

### Scripts do frontend

| Script | Descrição |
| --- | --- |
| `npm start` | Inicia o Angular Dev Server através de `ng serve`. |
| `npm run build` | Gera o build da aplicação Angular. |
| `npm run watch` | Gera o build em modo development e observa alterações. |
| `npm test` | Executa os testes Angular. |
| `npm run ng` | Disponibiliza diretamente o Angular CLI. |

## Estrutura do backend

```text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── infra/
│   │   ├── mongo/
│   │   ├── prisma/
│   │   └── redis/
│   ├── modules/
│   │   ├── auth/
│   │   ├── task/
│   │   └── user/
│   ├── app.module.ts
│   └── main.ts
├── Dockerfile
├── package.json
├── prisma7.config.ts
├── nest-cli.json
├── tsconfig.json
└── vitest.config.ts
```

### `prisma/`

Responsável pelo modelo relacional da aplicação.

- `schema.prisma`: definição dos modelos e relacionamentos do MySQL.
- `migrations/`: histórico de migrations do banco.

Os principais modelos relacionais são:

- `User`
- `Task`
- `TaskPriority`
- `TaskStatus`

### `src/config/`

Configurações globais da aplicação.

`env.validation.ts` define e valida as variáveis de ambiente necessárias para MySQL, MongoDB, Redis, JWT e execução da API.

### `src/infra/`

Integrações de infraestrutura.

```text
infra/
├── mongo/
├── prisma/
└── redis/
```

- `mongo/`: configuração da conexão MongoDB/Mongoose.
- `prisma/`: serviço responsável pela conexão com MySQL através do Prisma.
- `redis/`: serviço responsável pela conexão com Redis.

### `src/modules/`

O backend é organizado por domínio.

```text
modules/
├── auth/
├── task/
└── user/
```

#### `auth/`

Responsável por autenticação e autorização.

Contém:

- controller
- service
- module
- DTOs
- guard JWT
- decorators
- errors
- documentação Swagger
- tipos
- testes

#### `task/`

Responsável pelo gerenciamento de tarefas.

```text
task/
├── docs/
├── dto/
├── enums/
├── errors/
├── repositories/
├── schemas/
├── tests/
├── task.controller.ts
├── task.module.ts
└── task.service.ts
```

- `docs/`: documentação Swagger dos endpoints.
- `dto/`: contratos de criação e atualização.
- `enums/`: prioridades e status das tarefas.
- `errors/`: erros específicos do domínio.
- `repositories/`: acesso aos dados.
- `schemas/`: schemas utilizados pelo MongoDB.
- `tests/`: testes unitários e E2E.
- `task.controller.ts`: endpoints REST.
- `task.service.ts`: regras de negócio.
- `task.module.ts`: composição do módulo.

Os dados principais das tarefas são armazenados no MySQL. O MongoDB é utilizado para informações adicionais, como histórico de alterações.

#### `user/`

Responsável pelo acesso aos dados de usuário utilizados pelos demais módulos.

### `app.module.ts`

Módulo raiz do backend.

Responsável por registrar:

- ConfigModule
- MongoDB/Mongoose
- AuthModule
- TaskModule
- PrismaService

### `main.ts`

Bootstrap da API.

Responsável por:

- inicializar NestJS
- registrar o `ValidationPipe`
- configurar Swagger
- iniciar o servidor HTTP

## Estrutura do frontend

```text
frontend/
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   └── layout/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   └── tasks/
│   │   ├── app.component.*
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── proxy.conf.json
├── proxy.docker.conf.json
└── Dockerfile
```

### `public/`

Arquivos estáticos da aplicação, como imagens, logo e favicon.

### `src/app/core/`

Funcionalidades globais utilizadas por toda a aplicação.

```text
core/
├── auth/
└── layout/
```

#### `core/auth/`

Contém a infraestrutura de autenticação do frontend:

- `auth-token.interceptor.ts`: adiciona o access token às requisições e trata o fluxo de autenticação.
- `auth.guard.ts`: protege rotas que exigem autenticação.
- `auth.models.ts`: modelos utilizados pela autenticação.
- `auth.service.ts`: comunicação com os endpoints de autenticação.
- `session.ts`: gerenciamento dos dados da sessão no navegador.

#### `core/layout/`

Componentes estruturais compartilhados.

```text
layout/
├── app-header/
└── authenticated-layout/
```

- `app-header/`: cabeçalho utilizado na área autenticada.
- `authenticated-layout/`: layout base das páginas protegidas.

### `src/app/features/`

Funcionalidades específicas da aplicação.

```text
features/
├── auth/
└── tasks/
```

#### `features/auth/`

Componentes das telas de autenticação:

```text
auth/
├── form-field/
├── login/
└── register/
```

- `form-field/`: componente reutilizável de campos dos formulários.
- `login/`: tela de login.
- `register/`: tela de cadastro.

#### `features/tasks/`

Funcionalidade principal de gerenciamento de tarefas.

```text
tasks/
├── components/
│   ├── task-card/
│   └── task-modal/
├── task.models.ts
├── task.service.ts
├── tasks.component.ts
├── tasks.component.html
└── tasks.component.scss
```

- `task-card/`: apresentação individual de uma tarefa.
- `task-modal/`: criação e edição de tarefas.
- `task.models.ts`: interfaces e modelos das tarefas.
- `task.service.ts`: comunicação com a API de tarefas.
- `tasks.component.*`: tela principal de listagem e gerenciamento de tarefas.

### `app.config.ts`

Configuração global do Angular.

Registra:

- router
- HttpClient
- interceptor de autenticação

### `app.routes.ts`

Define as rotas públicas e autenticadas da aplicação.

### `proxy.conf.json`

Proxy utilizado durante o desenvolvimento local.

Encaminha chamadas `/api` para o backend em `localhost:3000`.

### `proxy.docker.conf.json`

Proxy utilizado quando o frontend é executado pelo Docker Compose.

Encaminha chamadas `/api` para o serviço Docker `backend:3000`.

## Testes

### Backend

Testes unitários:

```bash
cd backend
npm run test:unit
```

Testes E2E:

```bash
cd backend
npm run test:e2e
```

O fluxo E2E sobe automaticamente os bancos específicos de teste, executa as migrations, roda os testes e remove os containers ao finalizar.
