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

## Possíveis melhorias futuras

### Robustez

* **Fila de outbox / mensageria** 
Em vez de o cron varrer a tabela, persistir um evento (order.created) e processar via fila (Redis/BullMQ, SQS, RabbitMQ). Ganha desacoplamento, retry com backoff e evita duas
instâncias do cron processarem o mesmo pedido.

* **Claim atômico no sync**
Hoje o job lista e processa em série; dois crons paralelos podem sincronizar o mesmo pedido. Usar `SELECT … FOR UPDATE SKIP LOCKED` (ou status SYNCING + UPDATE … WHERE status IN (…) 
RETURNING *) para “pegar” um lote com exclusão mútua.

* **Backoff, tentativas e dead letter**
Campos attemptCount, nextRetryAt, lastError. Retryable com intervalo crescente; após N falhas → FAILED_PERMANENT ou fila DLQ para análise manual.

* **Idempotência também no ERP**
Enviar a mesma idempotencyKey/orderNumber ao ERP e tratar “já existe” como sucesso. Evita duplicar pedido externo se o timeout ocorrer depois do commit no ERP.

* **Timeout real no adapter**
O modo timeout só atrasa e lança erro; falta AbortController/deadline real e cancelamento da chamada HTTP.

* **Migrations em vez de synchronize: true**
Schema controlado, reversível e seguro em produção.

* **Observabilidade**
Métricas (taxa de sync, idade da fila, 4xx/5xx), tracing (OpenTelemetry) e alertas quando FAILED_RETRYABLE ou backlog crescer.

* **Contrato de payload na idempotência**
Hoje a mesma chave com body diferente devolve o pedido antigo. Guardar hash do body e rejeitar conflito (409) se a chave for reusada com dados distintos.

### Performance

* **Processamento em paralelo com limite**
Substituir o for sequencial por pool (p-limit / workers) — ex.: 5–10 syncs simultâneos — sem saturar o ERP.

* **Lotes e índices**
Índice composto (status, syncedAt, nextRetryAt); buscar com LIMIT/ORDER BY createdAt em vez de carregar tudo.

* **Paginação em GET /orders**
Cursor/offset + filtros por status/data; evitar listar a tabela inteira.

* **Connection pooling**
Pool TypeORM/PgBouncer dimensionado; healthchecks no Compose (depends_on com condição).

* **Cache só onde fizer sentido**
Status de pedido de leitura frequente (Redis) com invalidação no sync — não cachear criação.

* **Separar API e worker**
Processos/containers distintos: a API não compete com o sync por CPU/conexões; escala independente.