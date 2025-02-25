import requests
import re
import time
import io
import contextlib
import json
import logging
import traceback

# Configurações do sistema em formato JSON
CONFIG_JSON = """
{
  "objective": "Objetivo é gerar uma api em python com 1 método ping que responde pong e um método que manda uma msg no telegram recebendo msg como parametro",
  "lm_api_url": "http://localhost:1234/v1/completions",
  "model": "stable-code-instruct-3b",
  "max_tokens": 256,
  "temperature": 0.7,
  "sleep_interval": 1,
  "completion_indicator": "OBJETIVO_CONCLUIDO"
}
"""

# Carrega as configurações
config = json.loads(CONFIG_JSON)

# Configuração aprimorada de logs para console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

def call_lm_studio(prompt: str) -> str:
    payload = {
        "model": config["model"],
        "prompt": prompt,
        "max_tokens": config["max_tokens"],
        "temperature": config["temperature"]
    }
    try:
        logger.info("Enviando prompt para LM Studio: %s", prompt)
        response = requests.post(config["lm_api_url"], json=payload)
        response.raise_for_status()
        data = response.json()
        if not data or "choices" not in data or not data["choices"]:
            logger.warning("Resposta inválida do LM Studio.")
            return ""
        llm_response = data["choices"][0].get("text", "")
        logger.info("Resposta do LLM: %s", llm_response)
        return llm_response
    except requests.exceptions.RequestException as e:
        logger.error("Erro na requisição ao LM Studio: %s", e)
        return ""

def extract_code(text: str) -> str:
    """
    Extrai o conteúdo de código delimitado por ```.
    Se não encontrar, retorna o texto original.
    Após extrair, remove a indicação de linguagem 'python' se presente na primeira linha.
    """
    match = re.search(r"```([\s\S]*?)```", text)
    if match:
        code = match.group(1).strip()
        logger.info("Código extraído do bloco delimitado por ```.")
    else:
        code = text.strip()
        logger.info("Bloco de código não encontrado, utilizando texto completo.")
    
    # Remove a indicação de linguagem "python" na primeira linha, se existir
    lines = code.splitlines()
    if lines and lines[0].strip().lower() == "python":
        logger.info("Removendo indicação de linguagem 'python' do código.")
        code = "\n".join(lines[1:])
    return code

def validate_code(code: str) -> (bool, str):
    """
    Tenta compilar o código para verificar sua sintaxe.
    Retorna (True, "") se estiver válido, ou (False, error_message) com o stacktrace completo.
    """
    try:
        compile(code, "<string>", "exec")
        logger.info("Código validado com sucesso.")
        return True, ""
    except SyntaxError:
        error_trace = traceback.format_exc()
        logger.error("Erro de compilação:\n%s", error_trace)
        return False, error_trace

def execute_generated_code(code: str) -> str:
    """
    Executa o código Python gerado e captura o stdout.
    Em caso de exceção, retorna a mensagem de erro com stacktrace.
    """
    env = {}
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        try:
            logger.info("Executando o código gerado...")
            exec(code, env, env)
        except Exception:
            error_trace = traceback.format_exc()
            logger.error("Erro de execução:\n%s", error_trace)
            return f"Erro de execução:\n{error_trace}"
    output = buffer.getvalue()
    logger.info("Código executado com sucesso.")
    return output

def check_objective(output: str) -> bool:
    """
    Verifica se o output contém o indicador de conclusão definido nas configurações.
    """
    if config["completion_indicator"] in output:
        logger.info("Indicador de conclusão encontrado no output.")
        return True
    return False

def main():
    current_prompt = config["objective"]
    logger.info("Iniciando o processo com o objetivo: %s", current_prompt)
    iteration = 1

    while True:
        logger.info("=== Iteração %d: Enviando prompt para LM Studio ===", iteration)
        response_text = call_lm_studio(current_prompt)
        if not response_text:
            logger.warning("Nenhuma resposta válida do LM Studio. Repetindo iteração...")
            time.sleep(config["sleep_interval"])
            continue

        code = extract_code(response_text)
        logger.info("=== Código Gerado (após extração) ===\n%s", code)

        is_valid, error_message = validate_code(code)
        if not is_valid:
            output = f"Erro de compilação:\n{error_message}"
        else:
            output = execute_generated_code(code)

        logger.info("=== Output da Execução ===\n%s", output)

        if check_objective(output):
            logger.info("Objetivo concluído! Encerrando o loop.")
            break

        current_prompt = output
        iteration += 1
        time.sleep(config["sleep_interval"])

if __name__ == "__main__":
    main()
