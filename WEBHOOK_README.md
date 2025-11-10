# Webhook ActiveCampaign - Resumo da Implementação

## 📁 Arquivos Criados

### 1. **Endpoint API** 
`src/app/api/webhook/update-student-status/route.ts`
- Recebe webhooks do ActiveCampaign
- Busca lead no Supabase pelo email
- Atualiza campos `is_aluno` e `is_aluno_bny2`
- Lógica inteligente baseada no nome da lista

### 2. **Documentação**
`WEBHOOK_SETUP.md`
- Guia completo de configuração
- Como configurar no ActiveCampaign
- Exemplos de payload
- Troubleshooting

### 3. **Scripts de Teste**
- `test-webhook-activecampaign.js` - Testa o webhook localmente
- `get-test-emails.js` - Busca emails válidos para teste

---

## 🚀 Como Usar

### 1. Desenvolvimento Local

```bash
# Terminal 1: Rodar o servidor
npm run dev

# Terminal 2: Testar o webhook
node test-webhook-activecampaign.js
```

### 2. Produção

Configure no ActiveCampaign:
```
URL: https://dash.mestreye.com/api/webhook/update-student-status
Evento: Subscribe to list
```

---

## 🔄 Fluxo de Funcionamento

```
ActiveCampaign → Webhook → API Next.js → Supabase
    ↓              ↓           ↓            ↓
Novo aluno   POST /api   Busca email   Atualiza
em lista    webhook/    no banco      is_aluno
            update-
            student-
            status
```

### Exemplo:

1. **Usuário é adicionado à lista "Alunos BNY2" no AC**
2. **AC envia webhook** para `/api/webhook/activecampaign`
3. **API busca** o email no Supabase
4. **API atualiza** `is_aluno_bny2 = true`
5. **Dashboard mostra** tag 🏆 BNY - Aluno

---

## 🎯 Lógica de Atualização

| Nome da Lista contém | Campo atualizado |
|---------------------|------------------|
| "bny" ou "bny2"     | `is_aluno_bny2 = true` |
| "aluno" ou "student" | `is_aluno = true` |
| Outras listas       | `is_aluno = true` (padrão) |

---

## ✅ Checklist de Deploy

- [ ] Fazer deploy da aplicação
- [ ] Anotar URL de produção
- [ ] Configurar webhook no ActiveCampaign
- [ ] Testar com um contato real
- [ ] Verificar logs do webhook
- [ ] Confirmar atualização no Supabase
- [ ] Verificar tag aparece no dashboard

---

## 🔧 Customização

### Mudar lógica de identificação

Edite `route.ts` linha ~55:

```typescript
// Por ID específico
if (listId === '123') {
  updateData.is_aluno_bny2 = true
}

// Por tag ao invés de lista
if (contact.tags?.includes('aluno-bny2')) {
  updateData.is_aluno_bny2 = true
}
```

### Adicionar mais campos

```typescript
updateData = {
  is_aluno: true,
  data_inscricao: new Date().toISOString(),
  ac_contact_id: contactId
}
```

---

## 📊 Monitoramento

### Ver logs em tempo real

**Vercel:**
```bash
vercel logs --follow
```

**Console do servidor:**
```
📥 Webhook recebido do ActiveCampaign
📧 Processando contato: email@example.com
✅ Lead encontrado: Nome do Lead
🏆 Marcando como aluno BNY2
✅ Lead atualizado com sucesso
```

---

## ⚠️ Importante

1. **Email deve existir no Supabase** - Se não existir, webhook ignora
2. **HTTPS obrigatório em produção** - ActiveCampaign só envia para HTTPS
3. **Testar localmente primeiro** - Use os scripts de teste
4. **Verificar permissões** - Supabase deve permitir UPDATE na tabela

---

## 🐛 Troubleshooting Comum

### "Lead não encontrado"
→ Email não existe no Supabase ou está diferente

### "Webhook não dispara"
→ Verificar URL configurada no AC e logs do webhook

### "Erro ao atualizar"
→ Verificar permissões do Supabase e se campos existem

---

## 📞 Próximos Passos

1. ✅ Endpoint criado
2. ✅ Documentação pronta
3. ✅ Scripts de teste
4. ⏳ Fazer deploy
5. ⏳ Configurar no ActiveCampaign
6. ⏳ Testar em produção

---

## 🎉 Pronto!

O sistema está configurado para automaticamente marcar alunos quando eles forem adicionados às listas no ActiveCampaign.
