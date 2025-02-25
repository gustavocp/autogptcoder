AutoGPT para Geração e Teste de Código com LLM



Este projeto automatiza a geração, teste e correção de códigos utilizando um modelo de linguagem (LLM) hospedado localmente. Ele itera até que um código funcional seja obtido, realizando testes automáticos e instalando dependências quando necessário.

🚀 Funcionalidades

✅ Geração de código a partir de uma descrição de objetivo.

✅ Teste automático do código gerado.

✅ Correção iterativa baseada nos erros encontrados.

✅ Instalação automática de dependências ausentes.

✅ Interface web para monitoramento do processo e execução de novos pedidos.

📋 Requisitos

Node.js 16+

Servidor de LLM acessível via API REST (exemplo: LM Studio rodando localmente)

NPM para instalação de dependências

⚙️ Configuração

Edite a constante CONFIG no arquivo principal para ajustar:

const CONFIG = {
  llmUrl: "http://localhost:1234/v1/completions",
  model: "qwen2.5-coder-0.5b-instruct",
  saveFolder: "tests",
  executionTimeout: 30,
};

📦 Instalação

npm install

▶️ Execução

Para iniciar o servidor:

node index.js

A interface estará disponível em:

http://localhost:3050/interface

📡 Uso via API

🔹 Iniciar geração de código

curl -X POST http://localhost:3050/start -H "Content-Type: application/json" -d '{"goal": "Criar um endpoint /ping que retorna pong"}'

🔹 Obter logs
