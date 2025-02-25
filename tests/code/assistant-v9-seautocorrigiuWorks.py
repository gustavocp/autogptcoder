#!/usr/bin/env python3
import streamlit as st
import sys, json, requests, subprocess, re, os, time
from datetime import datetime
from langchain.llms.base import BaseLLM
from langchain.schema import LLMResult, Generation

# ==================== CONFIGURAÇÕES ====================
CONFIG = {
    "llm_url": "http://192.168.0.103:1234/v1/completions",  # URL da API do LM Studio
    "model": "qwen2.5-coder-0.5b-instruct",       # Nome do modelo a ser utilizado
    "default_goal": "Criar um código em nodejs/express pra gerar uma api que tenha um método /ping e retorne 'pong'",
    "default_language": "javascript",   # Pode ser "python" ou "javascript"
    "max_tokens": 5000,         # Pode aumentar para 10k conforme necessário
    "temperature": 0.7,
    "max_iterations": 10,
    "save_folder": "tests",
    "execution_timeout": 5,     # Timeout em segundos para execução do código
    "final_validation": False   # Se True, realiza a validação final com o LLM; se False, pula essa etapa
}
# =======================================================

# Arquivos de logs
LOG_FILE = "logs/output.log"         # Arquivo de logs geral
CODE_FILE = "logs/code_output.log"   # Arquivo para salvar o código gerado

def count_tokens(text):
    return len(text.split())

def write_log(msg, log_list):
    print(msg)
    log_list.append(msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def detect_language(code):
    if re.search(r"def |import |print\(", code):
        return "python"
    if re.search(r"function |const |let |console\.log\(", code):
        return "javascript"
    return "unknown"

def get_language(code):
    lang = detect_language(code)
    return lang if lang != "unknown" else CONFIG["default_language"]

def extrair_codigo(resposta):
    pattern = r"```(?:python|javascript)?\n(.*?)```"
    blocos = re.findall(pattern, resposta, re.DOTALL)
    if blocos and blocos[0].strip():
        return blocos[0].strip()
    linhas = resposta.splitlines()
    codigo = []
    for linha in linhas:
        if re.search(r"^(def |import |print\(|function |const |let |console\.log\()", linha.strip()):
            codigo.append(linha)
    if codigo:
        return "\n".join(codigo).strip()
    return resposta.strip()

# ----------------- LANGCHAIN INTEGRAÇÃO -----------------
class LMStudioLLM(BaseLLM):
    """Wrapper para a API do LM Studio usando a interface BaseLLM do LangChain."""
    def _call(self, prompt: str, stop=None) -> str:
        tokens_prompt = count_tokens(prompt)
        start_time = time.time()
        payload = {
            "model": CONFIG["model"],
            "prompt": prompt,
            "max_tokens": CONFIG["max_tokens"],
            "temperature": CONFIG["temperature"]
        }
        try:
            response = requests.post(CONFIG["llm_url"], json=payload, timeout=300)
        except requests.Timeout:
            return "❌ Erro: resposta vazia do LLM."
        elapsed = time.time() - start_time
        raw_response = response.json()
        resposta = raw_response.get("choices", [{}])[0].get("text", "").strip()
        write_log(f"⏱ Requisição ao LLM: {elapsed:.2f}s, Tokens do prompt: {tokens_prompt}", [])
        tokens_response = count_tokens(resposta)
        write_log(f"⏱ Resposta do LLM: {elapsed:.2f}s, Tokens da resposta: {tokens_response}", [])
        time.sleep(5)  # Aguarda 5 segundos
        if not resposta:
            return "❌ Erro: resposta vazia do LLM."
        return extrair_codigo(resposta)
    
    def _generate(self, prompts: list[str], stop: list[str] = None) -> LLMResult:
        generations = []
        for prompt in prompts:
            text = self._call(prompt, stop=stop)
            generations.append([Generation(text=text)])
        return LLMResult(generations=generations)
    
    @property
    def _identifying_params(self):
        return {"model": CONFIG["model"]}
    
    @property
    def _llm_type(self) -> str:
        return "lmstudio"

llm_instance = LMStudioLLM()
# --------------------------------------------------------

def build_generation_prompt(iteration, goal, last_code, last_error):
    if iteration == 0:
        return (
            f"Escreva um código {CONFIG['default_language']} válido que resolva o seguinte objetivo: {goal}. "
            "Retorne apenas o código, sem comentários ou explicações extras."
        )
    else:
        return (
            f"Baseado no objetivo: {goal}\n\n"
            f"Último código gerado:\n{last_code}\n\n"
            f"Último erro observado:\n{last_error}\n\n"
            "Por favor, gere uma nova versão do código que corrija os erros e atenda ao objetivo. "
            "Retorne apenas o código."
        )

def build_correction_prompt(last_code, last_error, goal):
    """Constrói o prompt de correção usando a estrutura do LM Studio."""
    return (
        "<|im_start|>system\n"
        "You are Qwen, created by Alibaba Cloud. You are a helpful assistant.\n"
        "<|im_end|>\n"
        "<|im_start|>user\n"
        f"Último código gerado:\n{last_code}\n\n"
        f"Erro:\n{last_error}\n\n"
        f"Objetivo inicial: {goal}\n\n"
        "Corrija o código e retorne apenas o código corrigido.\n"
        "<|im_end|>"
    )

def generate_code(iteration, goal, last_code, last_error, log_list):
    prompt = build_generation_prompt(iteration, goal, last_code, last_error)
    write_log(f"Prompt gerado:\n{prompt}", log_list)
    resposta = llm_instance(prompt)
    return resposta
# --------------------------------------------------------

def auto_install_module(lang, module_name, log_list):
    try:
        if lang == "python":
            msg = f"⚙️ Tentando instalar o módulo '{module_name}' via pip..."
            write_log(msg, log_list)
            result = subprocess.run(["pip", "install", module_name], capture_output=True, text=True)
        elif lang == "javascript":
            npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
            msg = f"⚙️ Tentando instalar o módulo '{module_name}' via {npm_cmd}..."
            write_log(msg, log_list)
            result = subprocess.run([npm_cmd, "install", module_name], capture_output=True, text=True)
        else:
            return False, "Idioma não suportado para instalação automática."
        if result.returncode == 0:
            return True, result.stdout or result.stderr
        else:
            return False, result.stderr or result.stdout
    except Exception as e:
        return False, str(e)

def test_code(code, lang, log_list):
    cmd = {
        "python": ["python3", "-c", code],
        "javascript": ["node", "-e", code]
    }.get(lang)
    if not cmd:
        return False, "Linguagem não suportada"
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            stdout, stderr = proc.communicate(timeout=CONFIG["execution_timeout"])
        except subprocess.TimeoutExpired:
            proc.kill()
            return True, f"Timeout de {CONFIG['execution_timeout']}s atingido."
        output = stderr if stderr else stdout
        if proc.returncode == 0:
            return True, output
        return False, output
    except Exception as e:
        return False, str(e)

def save_code_file(code, iteration, log_list):
    folder = CONFIG["save_folder"]
    os.makedirs(folder, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = "py" if CONFIG["default_language"] == "python" else "js"
    filename = os.path.join(folder, f"interacao{iteration + 1}.{timestamp}.{ext}")
    with open(filename, "w", encoding="utf-8") as f:
        f.write(code)
    write_log(f"💾 Código salvo em: {filename}", log_list)
    code_msg = (
        "📝 Código gerado:\n"
        "----------------------------------------------------\n"
        + code +
        "\n----------------------------------------------------"
    )
    write_log(code_msg, log_list)
    os.makedirs(os.path.dirname(CODE_FILE), exist_ok=True)
    with open(CODE_FILE, "w", encoding="utf-8") as f:
        f.write(code)
    return filename

def auto_gpt_loop(goal, max_iterations):
    iteration = 0
    last_tested_code = ""
    last_error_output = ""
    log_list = []
    os.makedirs("logs", exist_ok=True)
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("Iniciando logs...\n")
    while iteration < max_iterations:
        write_log(f"🚀 Iteração {iteration + 1}: Gerando código para '{goal}'...", log_list)
        yield f"🚀 Iteração {iteration + 1}: Gerando código para '{goal}'..."
        code = generate_code(iteration, goal, last_tested_code, last_error_output, log_list)
        attempts = 0
        while len(code.splitlines()) < 5 and attempts < 3:
            msg = "❌ Código gerado muito curto (menos de 5 linhas). Solicitando nova geração..."
            write_log(msg, log_list)
            yield msg
            code = generate_code(iteration, goal, last_tested_code, last_error_output, log_list)
            attempts += 1
        if len(code.splitlines()) < 5:
            error_message = "❌ Falha: código gerado continua muito curto após múltiplas tentativas."
            write_log(error_message, log_list)
            yield error_message
            return
        save_code_file(code, iteration, log_list)
        last_tested_code = code  # Armazena apenas o código gerado
        lang = get_language(code)
        write_log(f"🔍 Código detectado como {lang}", log_list)
        yield f"🔍 Código detectado como {lang}"
        if lang == "unknown":
            error_msg = "❌ Linguagem não reconhecida!"
            write_log(error_msg, log_list)
            yield error_msg
            return
        write_log("🔍 Testando código...", log_list)
        yield "🔍 Testando código..."
        success, output = test_code(code, lang, log_list)
        if not success:
            missing_module = None
            if lang == "javascript" and "Cannot find module" in output:
                match = re.search(r"Cannot find module ['\"]([^'\"]+)['\"]", output)
                if match:
                    missing_module = match.group(1)
            elif lang == "python" and "ModuleNotFoundError:" in output:
                match = re.search(r"ModuleNotFoundError:\s+No module named ['\"]([^'\"]+)['\"]", output)
                if match:
                    missing_module = match.group(1)
            if missing_module:
                msg = f"❌ Módulo não encontrado: {missing_module}. Tentando instalar..."
                write_log(msg, log_list)
                yield msg
                install_success, install_output = auto_install_module(lang, missing_module, log_list)
                if install_success:
                    msg = f"✅ Módulo {missing_module} instalado com sucesso. Re-testando o código..."
                    write_log(msg, log_list)
                    yield msg
                    success, output = test_code(code, lang, log_list)
                else:
                    msg = f"❌ Falha ao instalar o módulo {missing_module}: {install_output}"
                    write_log(msg, log_list)
                    yield msg
        if success:
            write_log("✅ Código compilado/executado com sucesso!", log_list)
            yield "✅ Código compilado/executado com sucesso!"
            if CONFIG["final_validation"]:
                write_log("Validando com o LLM...", log_list)
                yield "Validando com o LLM..."
                validation_prompt = (
                    f"O código abaixo resolve o problema '{goal}' corretamente?\n\n{code}\n\n"
                    "Se sim, responda apenas SIM. Caso contrário, responda NÃO seguido de uma breve explicação do motivo."
                )
                validation = llm_instance(validation_prompt)
                if validation.startswith("❌ Erro: resposta vazia do LLM."):
                    write_log("❌ Erro: Encerrando devido a falha na validação do LLM.", log_list)
                    yield "❌ Erro: Encerrando devido a falha na validação do LLM."
                    return
                write_log(f"📝 Resposta da validação: {validation}", log_list)
                yield f"📝 Resposta da validação: {validation}"
                if "SIM" in validation.upper():
                    finish_msg = "🎯 Objetivo atingido!"
                    write_log(finish_msg, log_list)
                    yield finish_msg
                    return
                else:
                    not_satisfied_msg = "❌ O código não satisfaz completamente o objetivo."
                    write_log(not_satisfied_msg, log_list)
                    yield not_satisfied_msg
            else:
                val_disabled_msg = "Validação final desativada. Retornando o código..."
                write_log(val_disabled_msg, log_list)
                yield val_disabled_msg
            return
        else:
            error_msg = f"❌ Erro de compilação/execução:\n{output}"
            write_log(error_msg, log_list)
            yield error_msg
        last_error_output = output  # Armazena apenas o erro
        correction_msg = "Solicitando correção (usando o último código, o erro e o objetivo)..."
        write_log(correction_msg, log_list)
        yield correction_msg
        correction_prompt = build_correction_prompt(last_tested_code, last_error_output, goal)
        write_log("DEBUG: Correction prompt enviado:\n" + correction_prompt, log_list)
        yield "DEBUG: Correction prompt enviado (veja nos logs)."
        code = llm_instance(correction_prompt)
        attempts = 0
        while len(code.splitlines()) < 5 and attempts < 3:
            msg = "❌ Código corrigido muito curto (menos de 5 linhas). Solicitando nova correção..."
            write_log(msg, log_list)
            yield msg
            new_corr_prompt = (
                f"O código corrigido está muito curto ou incompleto. "
                f"Por favor, gere um código completo que atenda ao seguinte objetivo: {goal}. "
                "Retorne apenas o código, sem comentários ou explicações extras."
            )
            code = llm_instance(new_corr_prompt)
            attempts += 1
        if len(code.splitlines()) < 5:
            error_message = "❌ Falha: código corrigido continua muito curto após múltiplas tentativas."
            write_log(error_message, log_list)
            yield error_message
            return
        save_code_file(code, iteration, log_list)
        last_tested_code = code
        iteration += 1
    limit_msg = "🚨 Limite de iterações atingido! Última versão do código:"
    write_log(limit_msg, log_list)
    write_log(last_tested_code, log_list)
    yield limit_msg
    yield last_tested_code

# =============== STREAMLIT APP ===============
def main():
    st.set_page_config(layout="wide")
    st.title("AutoGPT com Streamlit e LangChain")
    goal = st.text_input("Objetivo (prompt):", CONFIG["default_goal"])
    col_code, col_logs = st.columns(2)
    code_placeholder = col_code.empty()
    logs_placeholder = col_logs.empty()
    execute_button = st.button("Executar")
    if execute_button and goal:
        if os.path.exists(LOG_FILE):
            os.remove(LOG_FILE)
        if os.path.exists(CODE_FILE):
            os.remove(CODE_FILE)
        loop = auto_gpt_loop(goal, CONFIG["max_iterations"])
        update_counter = 0
        try:
            while True:
                try:
                    mensagem = next(loop)
                except StopIteration:
                    break
                if os.path.exists(CODE_FILE):
                    with open(CODE_FILE, "r", encoding="utf-8") as f:
                        code_content = f.read()
                else:
                    code_content = ""
                update_counter += 1
                code_placeholder.text_area(
                    "Código Gerado",
                    value=code_content,
                    height=400,
                    key=f"codigo_gerado_area_{update_counter}"
                )
                if os.path.exists(LOG_FILE):
                    with open(LOG_FILE, "r", encoding="utf-8") as f:
                        logs_content = f.read()
                else:
                    logs_content = ""
                logs_placeholder.text_area(
                    "Logs",
                    value=logs_content,
                    height=400,
                    key=f"logs_area_{update_counter}"
                )
                time.sleep(0.5)
        except KeyboardInterrupt:
            st.warning("Execução interrompida manualmente (Ctrl + C).")
            return

if __name__ == "__main__":
    main()
