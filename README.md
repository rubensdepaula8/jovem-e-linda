# Estúdio Jovem e Linda — versão corrigida

Esta versão corrige os principais problemas encontrados no app publicado no GitHub Pages.

## O que foi corrigido

- Removidas as chamadas para imagens inexistentes `logo-izabel.png`, `logo-emanuel.png`, `icon-192.png` e `icon-512.png`.
- Criado `icon.svg`, evitando ícones quebrados no navegador/celular.
- WhatsApp do salão ficou centralizado em `config.js` e também pode ser alterado no painel Admin > Config.
- Senha do admin não fica mais escrita em texto aberto no código; foi substituída por hash SHA-256.
- Fluxo de agendamento revisado.
- Painel admin com agenda, profissionais, serviços, configurações e exportação CSV.
- Bloqueio de horários já ocupados pelo mesmo profissional.
- Correções de layout responsivo para celular.

## Senha do admin

A senha padrão continua sendo:

```txt
jovem2024
```

Para trocar a senha, gere um hash SHA-256 da nova senha e substitua o valor de `ADMIN_PIN_SHA256` no arquivo `config.js`.

## Trocar WhatsApp do salão

Abra o arquivo `config.js` e troque:

```js
WHATSAPP_NUMBER: "5511999999999"
```

Por exemplo:

```js
WHATSAPP_NUMBER: "5583999999999"
```

Use sempre DDI + DDD + número, sem espaço, sem traço e sem parênteses.

## Como publicar no GitHub Pages

1. Abra o repositório `jovem-e-linda` no GitHub.
2. Envie/substitua estes arquivos na branch `main`:
   - `index.html`
   - `style.css`
   - `app.js`
   - `config.js`
   - `manifest.json`
   - `icon.svg`
3. Aguarde o GitHub Pages atualizar.
4. Abra o link publicado em uma aba anônima para testar.

## Limitação importante

Esta versão ainda salva os agendamentos no navegador usando `localStorage`. Isso é suficiente para demonstração e uso local, mas não é uma agenda compartilhada real.

Para o salão usar em produção de verdade, o próximo passo é conectar com Supabase, Firebase ou PHP + MySQL. Assim, os agendamentos feitos no celular dos clientes aparecem no painel do salão em qualquer computador.
