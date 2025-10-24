# Sistema de Controle de Reservas - Temporada 2025/2026

## 📋 Arquivos do Sistema

Este sistema foi refatorado e separado em 3 arquivos principais:

1. **index.html** - Estrutura HTML da aplicação
2. **styles.css** - Estilos e layout
3. **script.js** - Lógica e funcionalidades

## ✅ Correções Implementadas

### Erros Críticos Corrigidos
- ✅ **Charset corrigido:** `UTF-TRF-8` → `UTF-8`
- ✅ **Erro de cálculo de mês:** Linha 1190 corrigida (`+ 11` → `+ 1`)

### Melhorias de Segurança
- ✅ Tratamento de erros melhorado para `localStorage`
- ✅ Event listener inline removido (onclick)

### Melhorias de Arquitetura
- ✅ Código separado em arquivos distintos (HTML, CSS, JS)
- ✅ Melhor organização e manutenibilidade
- ✅ Facilita o cache do navegador

## 🚀 Como Usar

1. **Coloque os 3 arquivos na mesma pasta:**
   - index.html
   - styles.css
   - script.js

2. **Abra o arquivo `index.html` no navegador**
   - Funciona offline (não precisa de servidor)
   - Compatível com Chrome, Firefox, Edge e Safari

3. **Todas as funcionalidades originais foram mantidas:**
   - Gerenciamento de reservas
   - Controle de clientes
   - Sistema de limpeza
   - Relatórios financeiros
   - Importação/Exportação de dados

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- 💻 Desktop
- 📱 Tablets
- 📱 Smartphones

## 💾 Armazenamento

Os dados são salvos localmente no navegador usando `localStorage`. Para fazer backup:
- Use a opção "Exportar Backup Completo" no menu
- Guarde o arquivo .json em local seguro

## ⚠️ Observações Importantes

- **Não limpe os dados do navegador** sem antes fazer backup
- **Backup automático** pode ser ativado nas configurações
- **Modo de segurança** previne alterações acidentais

## 🔧 Suporte

Para dúvidas ou problemas, consulte a seção "Ajuda & Legenda" dentro do sistema.

