const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const vm = require('vm');

// Configurações isoladas em JSON
const config = {
  "objective": "Quero criar um código em nodejs com express que faz um crud de usuários, usuário tem nome, idade e genero.",
  "lmApiUrl": "http://localhost:1234/v1/completions",
  "model": "qwen2.5-coder-3b-instruct",
  "maxTokens": 256,
  "temperature": 0.7,
  "sleepInterval": 1000, // em milissegundos
  "completionIndicator": "OBJETIVO_CONCLUIDO",
  "iterationInstruction": "Segue o erro, revise e retorne um código novo em 1 arquivo sem nenhuma explicação antes ou depois.",
  "finalEvaluationInstruction": "Verificar se o último código gerado e que foi compilado satisfaz a instrução inicial."
};

// Garante que a pasta "tests" exista
const testsDir = path.join(__dirname, 'tests');
if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir);
}

/**
 * Envia um prompt para o LLM e retorna a resposta.
 */
async function callLLM(prompt) {
  const payload = {
    model: config.model,
    prompt: prompt,
    max_tokens: config.maxTokens,
    temperature: config.temperature
  };

  try {
    console.log(`\nEnviando prompt para LLM:\n${prompt}`);
    const response = await axios.post(config.lmApiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (
      response.data &&
      response.data.choices &&
      response.data.choices[0] &&
      response.data.choices[0].text
    ) {
      const llmResponse = response.data.choices[0].text;
      console.log(`Resposta do LLM:\n${llmResponse}`);
      return llmResponse;
    } else {
      console.log("Resposta inválida do LLM.");
      return "";
    }
  } catch (error) {
    console.error("Erro na requisição ao LLM:", error.message);
    return "";
  }
}

/**
 * Extrai o código do primeiro bloco delimitado por ```javascript ou ```js.
 * Se não encontrar, retorna string vazia.
 */
function extractCode(text) {
  // Regex para capturar um bloco de código com tag "javascript" ou "js"
  const regex = /```(?:javascript|js)\s*([\s\S]*?)```/i;
  const match = regex.exec(text);
  if (match && match[1].trim().length > 0) {
    console.log("Código extraído do bloco com tag 'javascript' ou 'js'.");
    return match[1].trim();
  }
  // Fallback: tenta extrair o primeiro bloco de código encontrado
  const fallbackRegex = /```([\s\S]*?)```/;
  const fallbackMatch = fallbackRegex.exec(text);
  if (fallbackMatch && fallbackMatch[1].trim().length > 0) {
    console.log("Código extraído do primeiro bloco de código.");
    return fallbackMatch[1].trim();
  }
  return "";
}

/**
 * Salva o código em um arquivo na pasta "tests".
 * Nome do arquivo: interacao5.<iteration>.<timestamp>.js
 */
function saveCodeFile(code, iteration) {
  const timestamp = Date.now();
  const filename = path.join(testsDir, `interacao5.${iteration}.${timestamp}.js`);
  fs.writeFileSync(filename, code);
  console.log(`Código salvo em: ${filename}`);
  return filename;
}

/**
 * Valida se o código compila sem erros usando vm.Script.
 * Retorna [true, ""] se compila ou [false, errorMessage] caso contrário.
 */
function validateCode(code) {
  try {
    new vm.Script(code);
    console.log("Código compilou com sucesso.");
    return [true, ""];
  } catch (error) {
    console.error("Erro de compilação:", error.toString());
    return [false, error.toString()];
  }
}

/**
 * Executa o arquivo de código com Node.js e retorna o output (stdout ou erro).
 */
function executeCode(filename) {
  return new Promise((resolve) => {
    exec(`node ${filename}`, (error, stdout, stderr) => {
      if (error) {
        const errOutput = `Erro de execução:\n${stderr || error.message}`;
        resolve(errOutput);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Chama o LLM para avaliar se o código compilado atende ao objetivo inicial.
 * Usa a instrução final para avaliação.
 */
async function evaluateCode(code, objective) {
  const prompt = `Verificar se o seguinte código atende ao objetivo: "${objective}".
Código:
\`\`\`javascript
${code}
\`\`\`
Responda apenas com "OK" se atender ao objetivo; caso contrário, descreva os problemas.`;
  const response = await callLLM(prompt);
  return response.trim();
}

/**
 * Pausa a execução por um determinado número de milissegundos.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Função principal que controla o fluxo iterativo.
 */
async function main() {
  // Na primeira iteração, usamos o objetivo; nas demais, o prompt será o output de erro + instrução iterativa.
  let currentPrompt = config.objective;
  let iteration = 1;

  console.log(`\nIniciando o processo com o objetivo:\n${currentPrompt}`);

  while (true) {
    // Para iterações seguintes, se houver erro, atualizamos o prompt com o erro + instrução iterativa.
    if (iteration > 1) {
      currentPrompt = `${currentPrompt}\n${config.iterationInstruction}`;
    }
    
    const llmResponse = await callLLM(currentPrompt);
    if (!llmResponse) {
      console.log("Nenhuma resposta válida do LLM. Repetindo iteração...");
      await sleep(config.sleepInterval);
      continue;
    }

    // Extrai o código da resposta; se não houver, atualiza o prompt e repete
    let code = extractCode(llmResponse);
    if (!code) {
      console.log("Resposta não contém código. Atualizando prompt para 'retorna apenas o código em nodejs, não quero explicações. Quero testar seu código!'");
      currentPrompt = "retorna apenas o código em nodejs, não quero explicações. Quero testar seu código!";
      await sleep(config.sleepInterval);
      continue;
    }

    console.log(`\n=== Código Gerado (após extração) ===\n${code}`);

    // Salva o código em um arquivo
    saveCodeFile(code, iteration);

    // Valida se o código compila
    const [isValid, errorMessage] = validateCode(code);
    if (!isValid) {
      console.log(`\nErro de compilação: ${errorMessage}`);
      // Atualiza o prompt para a próxima iteração: erro + instrução iterativa
      currentPrompt = `${errorMessage}\n${config.iterationInstruction}`;
    } else {
      // O código compilou; agora, vamos avaliar se ele atende ao objetivo inicial.
      const evaluation = await evaluateCode(code, config.objective);
      console.log(`\nAvaliação do código pelo LLM:\n${evaluation}`);
      // Se a resposta for "OK" (ignorando case e espaços), consideramos o objetivo atingido.
      if (evaluation.trim().toUpperCase() === "OK") {
        console.log("\nCódigo compilou e atende ao objetivo. Processo concluído!");
        break;
      } else {
        console.log("\nO código compilou, mas não atende ao objetivo. Atualizando prompt com avaliação.");
        currentPrompt = `${evaluation}\n${config.iterationInstruction}`;
      }
    }
    
    iteration++;
    await sleep(config.sleepInterval);
  }
}

main();
