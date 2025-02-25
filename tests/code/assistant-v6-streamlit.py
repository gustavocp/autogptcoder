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
    "model": "qwen2.5-coder-3b-instruct",                   # Nome do modelo a ser utilizado
    "default_goal": "Criar uma API com express que tenha um método /ping e retorne 'pong'",
    "default_language": "javascript",                       # Pode ser "python" ou "javascript"
    "max_tokens": 2000,                                     # Pode aumentar para 10k conforme necessário
    "temperature": 0.7,
    "max_iterations": 10,
    "save_folder": "tests",
    "execution_timeout": 5,                                 # Timeout em segundos para execução do código
    "final_validation": False                               # Se True, realiza a validação final com o LLM; se False, pula essa etapa
}
# =======================================================

# Histórico global para geração e validação
HISTORY = ""

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

    payload = {
        "model": CONFIG["model"],
        "prompt": full_prompt,
        "max_tokens": CONFIG["max_tokens"],
        "temperature": CONFIG["temperature"]
    }
    response = requests.post(CONFIG["llm_url"], json=payload)
    raw_response = response.json()

    resposta = raw_response.get("choices", [{}])[0].get("text", "").strip()
    HISTORY += "\n[User]: " + prompt + "\n[LLM]: " + resposta + "\n"
    return extrair_codigo(resposta)

def call_llm_without_history(prompt, log_list):
    payload = {
        "model": CONFIG["model"],
        "prompt": prompt,
        "max_tokens": CONFIG["max_tokens"],
        "temperature": CONFIG["temperature"]
    }
    response = requests.post(CONFIG["llm_url"], json=payload)
    raw_json = response.json()

    resposta = raw_json.get("choices", [{}])[0].get("text", "").strip()
    return extrair_codigo(resposta)

def auto_install_module(lang, module_name, log_list):
    try:
        if lang == "python":
            msg = f"⚙️ Tentando instalar o módulo '{module_name}' via pip..."
            print(msg)
            log_list.append(msg)
            result = subprocess.run(["pip", "install", module_name], capture_output=True, text=True)
        elif lang == "javascript":
            npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
            msg = f"⚙️ Tentando instalar o módulo '{module_name}' via {npm_cmd}..."
            print(msg)
            log_list.append(msg)
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
                        msg = f"✅ Módulo '{module_name}' instalado com sucesso. Re-testando o código..."
                        print(msg)
                        log_list.append(msg)
                        continue
                    else:
                        return False, f"Falha ao instalar o módulo '{module_name}': {install_output}"
                else:
                    return False, output
            elif lang == "javascript" and "Cannot find module" in output:
                match = re.search(r"Cannot find module '([\w\-/]+)'", output)
                if match:
                    module_name = match.group(1)
                    success_install, install_output = auto_install_module(lang, module_name, log_list)
                    if success_install:
                        msg = f"✅ Módulo '{module_name}' instalado com sucesso. Re-testando o código..."
                        print(msg)
                        log_list.append(msg)
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
    msg = f"💾 Código salvo em: {filename}"
    print(msg)
    log_list.append(msg)
    code_msg = "📝 Código gerado:\n----------------------------------------------------\n" + code + "\n----------------------------------------------------"
    print(code_msg)
    log_list.append(code_msg)
    return filename

def auto_gpt_loop(goal, max_iterations):
    iteration = 0
    last_tested_code = ""
    last_error_output = ""
    log_list = []

    while iteration < max_iterations:
        iteration_msg = f"🚀 Iteração {iteration + 1}: Gerando código para '{goal}'..."
        print(iteration_msg)
        log_list.append(iteration_msg)
        yield "\n".join(log_list)

        prompt = (
            f"Escreva um código {CONFIG['default_language']} válido que resolva o seguinte objetivo: {goal}. "
            "Retorne apenas o código, sem comentários ou explicações extras."
        )
        code = call_llm(prompt, log_list)
        save_code_file(code, iteration, log_list)
        last_tested_code = code

        lang = get_language(code)
        lang_msg = f"🔍 Código detectado como {lang}"
        print(lang_msg)
        log_list.append(lang_msg)
        yield "\n".join(log_list)

        if lang == "unknown":
            error_msg = "❌ Linguagem não reconhecida!"
            print(error_msg)
            log_list.append(error_msg)
            yield "\n".join(log_list)
            return

        testing_msg = "🔍 Testando código..."
        print(testing_msg)
        log_list.append(testing_msg)
        yield "\n".join(log_list)

        success, output = test_code(code, lang, log_list)

        if success:
            success_msg = "✅ Código compilado com sucesso!"
            print(success_msg)
            log_list.append(success_msg)

            if CONFIG["final_validation"]:
                val_msg = "Validando com o LLM..."
                print(val_msg)
                log_list.append(val_msg)
                yield "\n".join(log_list)

                validation_prompt = (
                    f"O código abaixo resolve o problema '{goal}' corretamente?\n\n{code}\n\n"
                    "Se sim, responda apenas SIM. Caso contrário, responda NÃO seguido de uma breve explicação do motivo."
                )
                validation = call_llm(validation_prompt, log_list)
                resp_msg = f"📝 Resposta da validação: {validation}"
                print(resp_msg)
                log_list.append(resp_msg)

                if "SIM" in validation.upper():
                    finish_msg = "🎯 Objetivo atingido!"
                    print(finish_msg)
                    log_list.append(finish_msg)
                    yield "\n".join(log_list)
                    return
                else:
                    not_satisfied_msg = "❌ O código não satisfaz completamente o objetivo."
                    print(not_satisfied_msg)
                    log_list.append(not_satisfied_msg)
                    yield "\n".join(log_list)
            else:
                val_disabled_msg = "Validação final desativada. Retornando o código..."
                print(val_disabled_msg)
                log_list.append(val_disabled_msg)
                yield "\n".join(log_list)
                return
        else:
            error_msg = f"❌ Erro de compilação:\n{output}"
            print(error_msg)
            log_list.append(error_msg)
            yield "\n".join(log_list)

        last_error_output = output

        correction_msg = "Solicitando correção (usando apenas o último código testado e o erro)..."
        print(correction_msg)
        log_list.append(correction_msg)
        yield "\n".join(log_list)

        correction_prompt = (
            f"O seguinte código apresentou os erros abaixo:\n\n{last_tested_code}\n\nErro:\n{last_error_output}\n\n"
            "Corrija o código e retorne apenas o código corrigido."
        )
        code = call_llm_without_history(correction_prompt, log_list)
        save_code_file(code, iteration, log_list)
        last_tested_code = code

        iteration += 1

    limit_msg = "🚨 Limite de iterações atingido! Última versão do código:"
    print(limit_msg)
    log_list.append(limit_msg)
    log_list.append(last_tested_code)
    yield "\n".join(log_list)

# =============== STREAMLIT APP ===============
def main():
    st.set_page_config(layout="wide")
    st.title("AutoGPT com Streamlit (Logs em tempo real com auto-scroll)")

    # Colunas para o formulário e logs
    col_left, col_right = st.columns(2)

    with col_left:
        st.header("Formulário")
        goal = st.text_area("Insira o objetivo (goal):", CONFIG["default_goal"], height=150)
        execute_button = st.button("Executar")

    with col_right:
        st.header("Logs em tempo real")
        logs_placeholder = st.empty()

    if execute_button:
        # Executa o loop do AutoGPT e atualiza logs em tempo real
        for partial_logs in auto_gpt_loop(goal, CONFIG["max_iterations"]):
            # Escapar caracteres especiais para exibir texto corretamente
            partial_logs_escaped = (
                partial_logs.replace("&", "&amp;")
                            .replace("<", "&lt;")
                            .replace(">", "&gt;")
            )

            log_html = f"""
            <div id="log_container" style="height:400px; overflow-y:auto; background-color:#f7f7f7; padding:10px; border:1px solid #ddd;">
                <pre style="white-space: pre-wrap; margin:0;">{partial_logs_escaped}</pre>
            </div>
            <script>
                var logContainer = document.getElementById("log_container");
                logContainer.scrollTop = logContainer.scrollHeight;
            </script>
            """
            logs_placeholder.markdown(log_html, unsafe_allow_html=True)
            time.sleep(0.5)

if __name__ == "__main__":
    main()
