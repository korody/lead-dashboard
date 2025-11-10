# Configuração do Webhook ActiveCampaign

## Endpoint Criado

**URL do Webhook:** `https://seu-dominio.com/api/webhook/activecampaign`

Este endpoint recebe notificações do ActiveCampaign quando um contato é adicionado a uma lista de alunos e atualiza automaticamente os campos `is_aluno` e `is_aluno_bny2` no Supabase.

---

## Como Configurar no ActiveCampaign

### 1. Acessar Configurações de Webhook

1. Faça login no ActiveCampaign
2. Vá em **Settings** (Configurações)
3. Clique em **Webhooks** no menu lateral

### 2. Criar Novo Webhook

1. Clique em **Add a webhook**
2. Preencha os campos:
   - **Webhook name:** `Atualizar Alunos Supabase`
   - **URL to call:** `https://seu-dominio.com/api/webhook/activecampaign`
   - **Action:** Selecione `Subscribe to list`
   - **Sources:** Selecione as listas de alunos relevantes

### 3. Eventos para Monitorar

Recomendado selecionar:
- ✅ **Subscribe to list** - Quando alguém se inscreve em uma lista
- ✅ **Add tag** - (opcional) Se você usar tags para marcar alunos
- ✅ **Update contact** - (opcional) Para atualizações de contato

### 4. Selecionar Listas Específicas

Configure para disparar quando o contato for adicionado às listas:
- Lista de "Alunos Mestre Ye" → atualiza `is_aluno = true`
- Lista de "Alunos BNY2" → atualiza `is_aluno_bny2 = true`

---

## Lógica de Atualização

O endpoint identifica automaticamente qual campo atualizar baseado no **nome da lista**:

### Lista contém "BNY" ou "BNY2"
→ Atualiza `is_aluno_bny2 = true`

### Lista contém "aluno" ou "student"
→ Atualiza `is_aluno = true`

### Lista não identificada
→ Atualiza `is_aluno = true` (padrão)

---

## Testando o Webhook

### 1. Testar se está ativo
```bash
curl https://seu-dominio.com/api/webhook/activecampaign
```

Resposta esperada:
```json
{
  "status": "active",
  "endpoint": "/api/webhook/activecampaign",
  "description": "Webhook para receber eventos do ActiveCampaign",
  "usage": "Configure este URL no ActiveCampaign webhook settings"
}
```

### 2. Testar manualmente com POST
```bash
curl -X POST https://seu-dominio.com/api/webhook/activecampaign \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscribe",
    "contact": {
      "id": "123",
      "email": "teste@example.com"
    },
    "list": {
      "id": "1",
      "name": "Alunos BNY2"
    }
  }'
```

### 3. Verificar logs
Os logs aparecem no console do servidor:
```
📥 Webhook recebido do ActiveCampaign
📧 Processando contato: teste@example.com (ID: 123)
✅ Lead encontrado: Nome do Lead
📋 Lista: Alunos BNY2 (ID: 1)
🏆 Marcando como aluno BNY2
✅ Lead atualizado com sucesso
```

---

## Payload do ActiveCampaign

Exemplo do que o ActiveCampaign envia:

```json
{
  "type": "subscribe",
  "date_time": "2025-11-10T10:30:00-05:00",
  "initiated_from": "admin",
  "initiated_by": "admin",
  "contact": {
    "id": "12345",
    "email": "usuario@example.com",
    "first_name": "João",
    "last_name": "Silva",
    "phone": "+5511999999999"
  },
  "list": {
    "id": "1",
    "name": "Alunos BNY2",
    "stringid": "alunos-bny2"
  }
}
```

---

## Segurança (Opcional)

Para adicionar segurança, você pode:

### 1. Validar IP do ActiveCampaign
Adicione verificação de IP permitido no código.

### 2. Usar Token de Autenticação
Configure um token secreto no ActiveCampaign e valide no endpoint.

Exemplo:
```typescript
const authToken = request.headers.get('x-webhook-token')
if (authToken !== process.env.AC_WEBHOOK_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## Troubleshooting

### Lead não encontrado
- ✅ Verificar se o email existe no Supabase
- ✅ Email deve ser exatamente igual (case sensitive)

### Webhook não dispara
- ✅ Verificar se a URL está correta e acessível
- ✅ Verificar logs do ActiveCampaign em Settings > Webhooks > View logs
- ✅ Certificar que HTTPS está configurado (AC requer HTTPS)

### Campos não atualizam
- ✅ Verificar logs do servidor
- ✅ Verificar se os campos `is_aluno` e `is_aluno_bny2` existem no Supabase
- ✅ Verificar permissões da tabela `quiz_leads`

---

## Personalização

### Ajustar lógica de identificação de listas

Edite o arquivo `src/app/api/webhook/activecampaign/route.ts`:

```typescript
// Exemplo: identificar por ID específico da lista
if (listId === '123') {
  updateData.is_aluno_bny2 = true
} else if (listId === '456') {
  updateData.is_aluno = true
}
```

### Adicionar mais campos

```typescript
updateData = {
  is_aluno: true,
  is_aluno_bny2: true,
  data_inscricao_aluno: new Date().toISOString(),
  activecampaign_id: contactId
}
```

---

## URL de Produção

Quando fizer deploy, configure a URL completa no ActiveCampaign:

- **Vercel:** `https://seu-app.vercel.app/api/webhook/activecampaign`
- **Outro host:** `https://seu-dominio.com/api/webhook/activecampaign`

---

## Monitoramento

Para monitorar webhooks recebidos, você pode:

1. Verificar logs do Vercel/servidor
2. Adicionar logging no Supabase (criar tabela `webhook_logs`)
3. Usar serviços como Sentry ou LogRocket para tracking de erros
