#!/usr/bin/env python3

import streamlit as st
import sys
import json
import requests
import subprocess
import re
import os
from datetime import datetime
import time

# ==================== CONFIGURAÇÕES ====================
CONFIG = {
    "llm_url": "http://192.168.0.103:1234/v1/completions",  # URL da API do LLM (LM Studio)
    "model": "deepseek-r1-distill-qwen-7b",                   # Nome do modelo a ser utilizado
    "default_goal": "Criar uma API com express que tenha um método /ping e retorne 'pong'",
    "default_language": "javascript",                       # Pode ser "python" ou "javascript"
    "max_tokens": 2000,                                     # Pode aumentar para 10k conforme necessário
    "temperature": 0.7,
    "max_iterations": 10,
    "save_folder": "tests",
    "execution_timeout": 5,                                # Timeout em segundos para execução do código
    "final_validation": False                              # Se True, realiza a validação final com o LLM; se False, pula essa etapa
}
# =======================================================

# Arquivos de logs
LOG_FILE = "logs/output.log"          # Arquivo de logs geral
CODE_FILE = "logs/code_output.log"    # Arquivo para salvar o código gerado

# Histórico global para geração e validação
HISTORY = ""

def count_tokens(text):
    # Contagem aproximada: divide o texto em espaços
    return len(text.split())

def write_log(msg, log_list):
    """Imprime, adiciona à lista e grava a mensagem no arquivo de logs."""
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

def call_llm(prompt, log_list):
    global HISTORY
    full_prompt = (HISTORY + "\n" + prompt) if HISTORY else prompt

    tokens_prompt = count_tokens(full_prompt)
    attempt = 0
    resposta = ""
    while attempt < 3:
        start_time = time.time()
        payload = {
            "model": CONFIG["model"],
            "prompt": full_prompt,
            "max_tokens": CONFIG["max_tokens"],
            "temperature": CONFIG["temperature"]
        }
        response = requests.post(CONFIG["llm_url"], json=payload)
        elapsed = time.time() - start_time

        write_log(f"⏱ Requisição ao LLM: {elapsed:.2f} segundos, Tokens do prompt: {tokens_prompt}", log_list)
        raw_response = response.json()
        resposta = raw_response.get("choices", [{}])[0].get("text", "").strip()
        tokens_response = count_tokens(resposta)
        write_log(f"⏱ Resposta do LLM: {elapsed:.2f} segundos, Tokens da resposta: {tokens_response}", log_list)
        
        if resposta:
            break
        else:
            attempt += 1
            write_log(f"⚠️ Resposta vazia do LLM. Tentando novamente ({attempt}/3)...", log_list)
    if not resposta:
        write_log("❌ Erro: resposta vazia após 3 tentativas.", log_list)
        return "❌ Erro: resposta vazia do LLM."
    HISTORY += "\n[User]: " + prompt + "\n[LLM]: " + resposta + "\n"
    return extrair_codigo(resposta)

def call_llm_without_history(prompt, log_list):
    tokens_prompt = count_tokens(prompt)
    attempt = 0
    resposta = ""
    while attempt < 3:
        start_time = time.time()
        payload = {
            "model": CONFIG["model"],
            "prompt": prompt,
            "max_tokens": CONFIG["max_tokens"],
            "temperature": CONFIG["temperature"]
        }
        response = requests.post(CONFIG["llm_url"], json=payload)
        elapsed = time.time() - start_time

        write_log(f"⏱ Requisição (sem histórico): {elapsed:.2f} segundos, Tokens do prompt: {tokens_prompt}", log_list)
        raw_json = response.json()
        resposta = raw_json.get("choices", [{}])[0].get("text", "").strip()
        tokens_response = count_tokens(resposta)
        write_log(f"⏱ Resposta (sem histórico): {elapsed:.2f} segundos, Tokens da resposta: {tokens_response}", log_list)
        
        if resposta:
            break
        else:
            attempt += 1
            write_log(f"⚠️ Resposta vazia do LLM (sem histórico). Tentando novamente ({attempt}/3)...", log_list)
    if not resposta:
        write_log("❌ Erro: resposta vazia após 3 tentativas (sem histórico).", log_list)
        return "❌ Erro: resposta vazia do LLM."
    return extrair_codigo(resposta)

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
    while True:
        try:
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            try:
                stdout, stderr = proc.communicate(timeout=CONFIG["execution_timeout"])
            except subprocess.TimeoutExpired:
                proc.kill()
                return True, f"Timeout de {CONFIG['execution_timeout']} segundos atingido. Processo possivelmente executando como esperado."
            output = stderr if stderr else stdout
            if proc.returncode == 0:
                return True, output
            if lang == "python" and "ModuleNotFoundError" in output:
                match = re.search(r"No module named '([\w\-]+)'", output)
                if match:
                    module_name = match.group(1)
                    success_install, install_output = auto_install_module(lang, module_name, log_list)
                    if success_install:
                        write_log(f"✅ Módulo '{module_name}' instalado com sucesso. Re-testando o código...", log_list)
                        continue
                    else:
                        return False, f"Falha ao instalar o módulo '{module_name}': {install_output}"
                else:
                    return False, output
            elif lang == "javascript" and "Cannot find module" in output:
                match = re.search(r"Cannot find module '([\w\-.\/]+)'", output)
                if match:
                    module_name = match.group(1)
                    success_install, install_output = auto_install_module(lang, module_name, log_list)
                    if success_install:
                        write_log(f"✅ Módulo '{module_name}' instalado com sucesso. Re-testando o código...", log_list)
                        continue
                    else:
                        return False, f"Falha ao instalar o módulo '{module_name}': {install_output}"
                else:
                    return False, output
            else:
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
    code_msg = "📝 Código gerado:\n----------------------------------------------------\n" + code + "\n----------------------------------------------------"
    write_log(code_msg, log_list)
    # Atualiza o arquivo que exibe o código gerado na interface
    os.makedirs(os.path.dirname(CODE_FILE), exist_ok=True)
    with open(CODE_FILE, "w", encoding="utf-8") as f:
        f.write(code)
    return filename

def auto_gpt_loop(goal, max_iterations):
    iteration = 0
    last_tested_code = ""
    last_error_output = ""
    log_list = []

    # Cria a pasta de logs se não existir e limpa o arquivo de log no início
    os.makedirs("logs", exist_ok=True)
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("Iniciando logs...\n")

    while iteration < max_iterations:
        iteration_msg = f"🚀 Iteração {iteration + 1}: Gerando código para '{goal}'..."
        write_log(iteration_msg, log_list)
        yield

        prompt = (
            f"Escreva um código {CONFIG['default_language']} válido que resolva o seguinte objetivo: {goal}. "
            "Retorne apenas o código, sem comentários ou explicações extras."
        )
        code = call_llm(prompt, log_list)
        save_code_file(code, iteration, log_list)
        last_tested_code = code

        lang = get_language(code)
        lang_msg = f"🔍 Código detectado como {lang}"
        write_log(lang_msg, log_list)
        yield

        if lang == "unknown":
            error_msg = "❌ Linguagem não reconhecida!"
            write_log(error_msg, log_list)
            yield
            return

        testing_msg = "🔍 Testando código..."
        write_log(testing_msg, log_list)
        yield

        success, output = test_code(code, lang, log_list)

        if success:
            success_msg = "✅ Código compilado com sucesso!"
            write_log(success_msg, log_list)

            if CONFIG["final_validation"]:
                val_msg = "Validando com o LLM..."
                write_log(val_msg, log_list)
                yield val_msg

                validation_prompt = (
                    f"O código abaixo resolve o problema '{goal}' corretamente?\n\n{code}\n\n"
                    "Se sim, responda apenas SIM. Caso contrário, responda NÃO seguido de uma breve explicação do motivo."
                )
                validation = call_llm(validation_prompt, log_list)
                resp_msg = f"📝 Resposta da validação: {validation}"
                write_log(resp_msg, log_list)

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
            error_msg = f"❌ Erro de compilação:\n{output}"
            write_log(error_msg, log_list)
            yield error_msg

        last_error_output = output

        correction_msg = "Solicitando correção (usando apenas o último código testado e o erro)..."
        write_log(correction_msg, log_list)
        yield correction_msg

        correction_prompt = (
            f"O seguinte código apresentou os erros abaixo:\n\n{last_tested_code}\n\nErro:\n{last_error_output}\n\n"
            "Corrija o código e retorne apenas o código corrigido."
        )
        code = call_llm_without_history(correction_prompt, log_list)
        save_code_file(code, iteration, log_list)
        last_tested_code = code

        iteration += 1

    limit_msg = "🚨 Limite de iterações atingido! Última versão do código:"
    write_log(limit_msg, log_list)
    write_log(last_tested_code, log_list)
    yield

# =============== STREAMLIT APP ===============
def main():
    st.set_page_config(layout="wide")
    st.title("AutoGPT com Streamlit")

    # Topbar: prompt para o objetivo
    goal = st.text_input("Objetivo (prompt):", CONFIG["default_goal"])

    # Layout: coluna esquerda para código gerado, coluna direita para logs
    col_code, col_logs = st.columns(2)

    # Espaços para atualizar a exibição
    code_placeholder = col_code.empty()
    logs_placeholder = col_logs.empty()

    # Botão para executar
    execute_button = st.button("Executar")

    if execute_button and goal:
        loop = auto_gpt_loop(goal, CONFIG["max_iterations"])
        while True:
            try:
                next(loop)
            except StopIteration:
                break

            # Atualiza o código gerado lido do arquivo CODE_FILE
            if os.path.exists(CODE_FILE):
                with open(CODE_FILE, "r", encoding="utf-8") as f:
                    code_content = f.read()
            else:
                code_content = ""

            code_placeholder.text_area("Código Gerado", value=code_content, height=400, key=f"generated_code_text_area_{time.time()}")

            # Atualiza os logs lidos do arquivo LOG_FILE
            if os.path.exists(LOG_FILE):
                with open(LOG_FILE, "r", encoding="utf-8") as f:
                    logs_content = f.read()
            else:
                logs_content = ""

            logs_placeholder.text_area("Logs", value=logs_content, height=400)
            time.sleep(0.5)

if __name__ == "__main__":
    main()
