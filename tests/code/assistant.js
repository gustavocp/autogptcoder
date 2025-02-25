#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const express = require("express");
const { exec } = require("child_process");

// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
  llmUrl: "http://192.168.0.103:1234/v1/completions", // URL da API do LM Studio
  model: "qwen2.5-coder-0.5b-instruct", // Nome do modelo a ser utilizado
  defaultGoal:
    "Criar um código em nodejs/express pra gerar uma api que tenha um método /ping e retorne 'pong'",
  defaultLanguage: "javascript", // Apenas javascript é suportado
  maxTokens: 5000,
  temperature: 0.7,
  maxIterations: 10,
  saveFolder: "tests",
  executionTimeout: 30, // Timeout de 30 segundos para execução do código
  finalValidation: false // Se true, realiza a validação final com o LLM; se false, pula esta etapa
};

const LOG_FILE = "logs/output.log"; // Arquivo de logs geral
const CODE_FILE = "logs/code_output.log"; // Arquivo para salvar o último código gerado

// Cria pastas necessárias
fs.mkdirSync("logs", { recursive: true });
fs.mkdirSync(CONFIG.saveFolder, { recursive: true });

// ---------------------- FUNÇÕES UTILITÁRIAS ----------------------
function countTokens(text) {
  return text.split(/\s+/).length;
}

function writeLog(msg, logList) {
  console.log(msg);
  logList.push(msg);
  fs.appendFileSync(LOG_FILE, msg + "\n", "utf8");
}

function detectLanguage(code) {
  // Suporta apenas javascript
  if (/function|const|let|console\.log\(/.test(code)) {
    return "javascript";
  }
  return "unknown";
}

function getLanguage(code) {
  const lang = detectLanguage(code);
  return lang !== "unknown" ? lang : CONFIG.defaultLanguage;
}

function extrairCodigo(texto) {
  const regex = /```(?:javascript)?\n([\s\S]*?)```/;
  const match = texto.match(regex);
  if (match && match[1].trim()) {
    return match[1].trim();
  }
  return texto.trim();
}

// ---------------------- COMUNICAÇÃO COM O LLM ----------------------
async function callLLM(prompt) {
  const tokensPrompt = countTokens(prompt);
  const startTime = Date.now();
  const payload = {
    model: CONFIG.model,
    prompt: prompt,
    max_tokens: CONFIG.maxTokens,
    temperature: CONFIG.temperature
  };

  try {
    const response = await axios.post(CONFIG.llmUrl, payload, {
      timeout: 300000
    });
    const elapsed = (Date.now() - startTime) / 1000;
    const rawResponse = response.data;
    const resposta =
      (rawResponse.choices && rawResponse.choices[0] && rawResponse.choices[0].text) || "";
    writeLog(
      `⏱ Requisição ao LLM: ${elapsed.toFixed(2)}s, Tokens do prompt: ${tokensPrompt}`,
      []
    );
    writeLog(
      `⏱ Resposta do LLM: ${elapsed.toFixed(2)}s, Tokens da resposta: ${countTokens(resposta)}`,
      []
    );
    // Aguarda 5 segundos
    await new Promise((resolve) => setTimeout(resolve, 5000));
    if (!resposta.trim()) {
      return "❌ Erro: resposta vazia do LLM.";
    }
    return extrairCodigo(resposta);
  } catch (error) {
    return "❌ Erro: resposta vazia do LLM.";
  }
}

async function callLLMWithMessages(messages) {
  const payload = {
    model: CONFIG.model,
    messages: messages,
    max_tokens: CONFIG.maxTokens,
    temperature: CONFIG.temperature
  };

  try {
    const response = await axios.post(CONFIG.llmUrl, payload, {
      timeout: 300000
    });
    const rawResponse = response.data;
    const resposta =
      (rawResponse.choices &&
        rawResponse.choices[0] &&
        rawResponse.choices[0].message &&
        rawResponse.choices[0].message.content) ||
      "";
    return extrairCodigo(resposta);
  } catch (error) {
    return "❌ Erro: resposta vazia do LLM.";
  }
}

// ---------------------- PROMPTS E MENSAGENS ----------------------
function buildGenerationPrompt(iteration, goal, lastCode, lastError) {
  if (iteration === 0) {
    return `Escreva um código ${CONFIG.defaultLanguage} válido que resolva o seguinte objetivo: ${goal}. Retorne apenas o código, sem comentários ou explicações extras.`;
  } else {
    return `Baseado no objetivo: ${goal}\n\nÚltimo código gerado:\n${lastCode}\n\nÚltimo erro observado:\n${lastError}\n\nPor favor, gere uma nova versão do código que corrija os erros e atenda ao objetivo. Retorne apenas o código.`;
  }
}

function buildCorrectionMessages(lastCode, lastError, goal) {
  return [
    {
      role: "system",
      content: "You are Qwen, created by Alibaba Cloud. You are a helpful assistant."
    },
    {
      role: "user",
      content: `Último código gerado:\n${lastCode}\n\nErro:\n${lastError}\n\nObjetivo inicial: ${goal}\n\nCorrija o código e retorne apenas o código corrigido, sem incluir mensagens de erro ou comentários extras.`
    }
  ];
}

async function generateCode(iteration, goal, lastCode, lastError, logList) {
  const prompt = buildGenerationPrompt(iteration, goal, lastCode, lastError);
  writeLog(`Prompt gerado:\n${prompt}`, logList);
  const resposta = await callLLM(prompt);
  return resposta;
}

// ---------------------- EXECUÇÃO E TESTE DO CÓDIGO ----------------------
async function autoInstallModule(moduleName, logList) {
  return new Promise((resolve) => {
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    writeLog(`⚙️ Tentando instalar o módulo '${moduleName}' via ${npmCmd}...`, logList);
    exec(`${npmCmd} install ${moduleName}`, (error, stdout, stderr) => {
      if (!error) {
        resolve({ success: true, output: stdout || stderr });
      } else {
        resolve({ success: false, output: stderr || stdout });
      }
    });
  });
}

async function testCode(code, logList) {
  const tempFileName = path.join(__dirname, "temp_test.js");
  fs.writeFileSync(tempFileName, code, "utf8");
  return new Promise((resolve) => {
    exec(`node ${tempFileName}`, { timeout: CONFIG.executionTimeout * 1000 }, (error, stdout, stderr) => {
      const output = stdout || stderr;
      if (error) {
        resolve({ success: false, output: output });
      } else {
        resolve({ success: true, output: output });
      }
    });
  });
}

function saveCodeFile(code, iteration, logList) {
  const folder = CONFIG.saveFolder;
  fs.mkdirSync(folder, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  const ext = "js"; // Apenas javascript
  const filename = path.join(folder, `interacao${iteration + 1}.${timestamp}.${ext}`);
  fs.writeFileSync(filename, code, "utf8");
  writeLog(`💾 Código salvo em: ${filename}`, logList);
  writeLog(
    "📝 Código gerado:\n----------------------------------------------------\n" +
      code +
      "\n----------------------------------------------------",
    logList
  );
  fs.mkdirSync(path.dirname(CODE_FILE), { recursive: true });
  fs.writeFileSync(CODE_FILE, code, "utf8");
  return filename;
}

// ---------------------- LOOP DE ITERAÇÕES (AUTO-GPT) ----------------------
async function runAutoGptLoop(goal, maxIterations) {
  let iteration = 0;
  let lastTestedCode = "";
  let lastErrorOutput = "";
  const logList = [];
  let finalCode = "";

  // Reinicia arquivos de log se existirem
  if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
  if (fs.existsSync(CODE_FILE)) fs.unlinkSync(CODE_FILE);
  writeLog("Iniciando logs...", logList);

  while (iteration < maxIterations) {
    writeLog(`🚀 Iteração ${iteration + 1}: Gerando código para '${goal}'...`, logList);
    let code = await generateCode(iteration, goal, lastTestedCode, lastErrorOutput, logList);
    let attempts = 0;
    while (code.split("\n").length < 5 && attempts < 3) {
      writeLog("❌ Código gerado muito curto (menos de 5 linhas). Solicitando nova geração...", logList);
      code = await generateCode(iteration, goal, lastTestedCode, lastErrorOutput, logList);
      attempts++;
    }
    if (code.split("\n").length < 5) {
      writeLog("❌ Falha: código gerado continua muito curto após múltiplas tentativas.", logList);
      break;
    }
    saveCodeFile(code, iteration, logList);
    lastTestedCode = code;
    const lang = getLanguage(code);
    writeLog(`🔍 Código detectado como ${lang}`, logList);
    if (lang === "unknown") {
      writeLog("❌ Linguagem não reconhecida!", logList);
      break;
    }
    writeLog("🔍 Testando código...", logList);
    let testResult = await testCode(code, logList);
    let success = testResult.success;
    let output = testResult.output;
    if (!success) {
      let missingModule = null;
      const match = output.match(/Cannot find module ['"]([^'"]+)['"]/);
      if (match) {
        missingModule = match[1];
      }
      if (missingModule) {
        writeLog(`❌ Módulo não encontrado: ${missingModule}. Tentando instalar...`, logList);
        const installResult = await autoInstallModule(missingModule, logList);
        if (installResult.success) {
          writeLog(`✅ Módulo ${missingModule} instalado com sucesso. Re-testando o código...`, logList);
          testResult = await testCode(code, logList);
          success = testResult.success;
          output = testResult.output;
        } else {
          writeLog(`❌ Falha ao instalar o módulo ${missingModule}: ${installResult.output}`, logList);
        }
      }
    }
    if (success) {
      writeLog("✅ Código compilado/executado com sucesso!", logList);
      if (CONFIG.finalValidation) {
        writeLog("Validando com o LLM...", logList);
        const validationPrompt = `O código abaixo resolve o problema '${goal}' corretamente?\n\n${code}\n\nSe sim, responda apenas SIM. Caso contrário, responda NÃO seguido de uma breve explicação do motivo.`;
        const validation = await callLLM(validationPrompt);
        writeLog(`📝 Resposta da validação: ${validation}`, logList);
        if (validation.trim().toLowerCase() === "sim") {
          writeLog("🎯 Objetivo atingido!", logList);
          finalCode = code;
          return { logs: logList, finalCode };
        } else {
          writeLog("❌ O código não satisfaz completamente o objetivo.", logList);
        }
      } else {
        writeLog("Validação final desativada. Retornando o código...", logList);
        finalCode = code;
        return { logs: logList, finalCode };
      }
    } else {
      writeLog(`❌ Erro de compilação/execução:\n${output}`, logList);
    }
    lastErrorOutput = output;
    writeLog("Solicitando correção (usando o último código, o erro e o objetivo)...", logList);
    const correctionMessages = buildCorrectionMessages(lastTestedCode, lastErrorOutput, goal);
    writeLog("DEBUG: Correction prompt enviado (veja nos logs).", logList);
    let correctedCode = await callLLMWithMessages(correctionMessages);
    attempts = 0;
    while (correctedCode.split("\n").length < 5 && attempts < 3) {
      writeLog("❌ Código corrigido muito curto (menos de 5 linhas). Solicitando nova correção...", logList);
      const newCorrPrompt = `O código corrigido está muito curto ou incompleto. Por favor, gere um código completo que atenda ao seguinte objetivo: ${goal}. Retorne apenas o código, sem comentários ou explicações extras.`;
      correctedCode = await callLLM(newCorrPrompt);
      attempts++;
    }
    if (correctedCode.split("\n").length < 5) {
      writeLog("❌ Falha: código corrigido continua muito curto após múltiplas tentativas.", logList);
      break;
    }
    saveCodeFile(correctedCode, iteration, logList);
    lastTestedCode = correctedCode;
    iteration++;
    finalCode = correctedCode;
  }
  writeLog("🚨 Fim do loop. Retornando resultados finais...", logList);
  return { logs: logList, finalCode };
}

// ---------------------- SERVIDOR EXPRESS E INTERFACE ----------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint para iniciar o processo (chamado via interface)
app.post("/start", async (req, res) => {
  const goal = req.body.goal || CONFIG.defaultGoal;
  const result = await runAutoGptLoop(goal, CONFIG.maxIterations);
  res.json(result);
});

// Endpoint para retornar os logs (para atualização automática)
app.get("/logs", (req, res) => {
  let logsContent = "";
  try {
    logsContent = fs.readFileSync(LOG_FILE, "utf8");
    const logsArray = logsContent.split("\n").filter(line => line.trim() !== "");
    logsContent = logsArray.reverse().join("\n");
  } catch (err) {
    logsContent = "Logs não disponíveis";
  }
  res.json({ logs: logsContent });
});

// Rota que retorna a interface HTML semelhante ao Streamlit
app.get("/interface", (req, res) => {
  let codeContent = "";
  let logsContent = "";
  
  try {
    codeContent = fs.readFileSync(CODE_FILE, "utf8");
  } catch (err) {
    codeContent = "Código não disponível";
  }
  
  try {
    logsContent = fs.readFileSync(LOG_FILE, "utf8");
    const logsArray = logsContent.split("\n").filter(line => line.trim() !== "");
    logsContent = logsArray.reverse().join("\n");
  } catch (err) {
    logsContent = "Logs não disponíveis";
  }
  
  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <title>Interface AutoGPT</title>
      <!-- Highlight.js CSS -->
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/monokai-sublime.min.css">
      <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          header { color: white; padding: 10px 20px; text-align: center; font-size: 1.2em; }
          .container { display: flex; flex-direction: column; height: calc(100vh - 60px); padding: 20px; }
          .top-form { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
          .top-form input[type="text"] { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 3px; }
          .top-form button { padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; }
          .top-form button:hover { background-color: #45a049; }
          .content { flex: 1; display: flex; gap: 20px; margin-bottom: 20px; }
          .column { flex: 1; background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow-y: auto; }
          pre { white-space: pre-wrap; word-wrap: break-word; }
      </style>
  </head>
  <body>
      <header id="statusBanner" style="background-color: red;">Status: <span id="statusText">PARADO</span></header>
      <div class="container">
          <div class="top-form">
              <input type="text" id="goal" name="goal" placeholder="Digite sua pergunta..." />
              <button id="executeBtn">Executar</button>
          </div>
          <div class="content">
              <div class="column">
                  <h2>Código Gerado</h2>
                  <pre><code id="codeArea" class="javascript">${codeContent}</code></pre>
              </div>
              <div class="column">
                  <h2>Logs</h2>
                  <pre id="logsArea">${logsContent}</pre>
              </div>
          </div>
      </div>
      <!-- Highlight.js -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
      <script>
          // Função para atualizar o status
          function setStatus(status) {
              const statusText = document.getElementById('statusText');
              const statusBanner = document.getElementById('statusBanner');
              statusText.textContent = status.toUpperCase();
              if (status.toLowerCase() === 'rodando') {
                  statusBanner.style.backgroundColor = 'green';
              } else {
                  statusBanner.style.backgroundColor = 'red';
              }
          }
          
          // Atualiza os logs a cada 3 segundos
          async function updateLogs() {
              try {
                  const response = await fetch('/logs');
                  const data = await response.json();
                  document.getElementById('logsArea').textContent = data.logs;
              } catch (error) {
                  console.error("Erro ao atualizar logs:", error);
              }
          }
          setInterval(updateLogs, 3000);
          
          const executeBtn = document.getElementById('executeBtn');
          executeBtn.addEventListener('click', async () => {
              setStatus("rodando");
              const goal = document.getElementById('goal').value;
              const response = await fetch('/start', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ goal })
              });
              const data = await response.json();
              // Atualiza a área de código e aplica highlight
              const codeArea = document.getElementById('codeArea');
              codeArea.textContent = data.finalCode;
              hljs.highlightElement(codeArea);
              setStatus("parado");
          });
      </script>
  </body>
  </html>
  `;
  res.send(html);
});

// Inicia o servidor na porta 3050
const PORT = 3050;
app.listen(PORT, () => {
  console.log(`Servidor iniciado. Acesse a interface em: http://localhost:${PORT}/interface`);
});
