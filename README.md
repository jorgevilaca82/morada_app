# Morada API

Morada API é um serviço de pedidos em Node.js/TypeScript (ESM) com Express, PostgreSQL via TypeORM e validação com Zod. A API recebe pedidos de forma idempotente (header
`X-Idempotency-Key` + constraint única no banco, com tratamento de corrida em transação) e os sincroniza com um ERP externo de forma assíncrona e desacoplada, por meio do job
`periodic:sync`. Logs estruturados com **Pino**; execução local com **Docker Compose** e tsx.

Métodos principais: 
* controller fino + service; 
* middleware de idempotência e validação; 
* adapter de ERP com simulação de sucesso/erro/timeout; 
* classificação de falhas em retryable vs
permanente; 
* sync periódico pensado para cron/processo separado da API HTTP.

## Rodando a aplicação

```shell
$ docker compose up -d
```

## Entrar no container Node e executar a aplicação

```shell
$ docker compose exec web /bin/bash
```

Passo opcional mas ajuda a evitar problemas com acesso e permissões em arquivos: `su node`

Executar a aplicação

```shell
$ npm run dev
```

## Endpoints

Base: `http://localhost:3000`

`POST /orders` — criar pedido

Exige `X-Idempotency-Key`. Pode ser quealquer string única, preferencialmente um hash MD5 ou outro padrão criptográfico. A estratégia de escolha dessa chave e de responsabilidade da aplicação cliente.
Body validado pelo Zod. 

```
curl -X POST http://localhost:3000/orders \
-H 'Content-Type: application/json' \
-H 'X-Idempotency-Key: create:pedido-001' \
-d '{
    "orderNumber": "99000",
    "customerName": "Jorge Silva",
    "totalAmount": 80,
    "userId": 1
}'
```

- `201` com o pedido (`status` inicial: `RECEIVED`)
- Mesma chave → mesmo pedido (idempotente, inclusive sob concorrência)
- Sem header ou body inválido → 400

`GET /orders` — listar pedidos

```
curl http://localhost:3000/orders
```

- `200` com array de pedidos.

`GET /orders/:orderId/status` — status do pedido

```
curl http://localhost:3000/orders/3/status
```

- `200` { "status": `"RECEIVED"` | `"PROCESSING"` | ... }
- `404` se não existir

`GET /` — health/hello

```
curl http://localhost:3000/
```

- `200` a aplicação está em pé e rodando

## Periodic Sync

Tarefa a ser executada em serviço diferente através de agendamento (cron jobs)
para sincronizar com o ERP os pedidos recebidos.

Para executar o sync:

```shell
$ npm run periodic:sync
``` 

Finalidade: sincronizar com o ERP os pedidos ainda não enviados, fora do request HTTP (job agendável por cron).

O que faz:
1. Conecta ao Postgres
2. Busca pedidos com status em RECEIVED ou FAILED_RETRYABLE e syncedAt nulo
3. Para cada um, chama o ErpAdapter
4. Sucesso → PROCESSING + syncedAt
5. Timeout/rede → FAILED_RETRYABLE (reentra no próximo sync)
6. Demais erros → FAILED_PERMANENT (não retenta)
7. Encerra a conexão e o processo

Assim a API só recebe o pedido; a integração com o ERP fica no worker periódico, com retries controlados pelo status.