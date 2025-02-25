#!/usr/bin/env python3
import sys
import json
import requests
import subprocess
import re
import os
from datetime import datetime

# ==================== CONFIGURAÇÕES ====================
CONFIG = {
    "llm_url": "http://192.168.0.103:1234/v1/completions",  # URL da API do LLM (LM Studio)
    "model": "qwen2.5-coder-3b-instruct",                    # Nome do modelo a ser utilizado
    "default_goal": "Criar uma API com express que tenha um método /ping e retorne 'pong'",
    "default_language": "javascript",                          # Pode ser "python" ou "javascript"
    "max_tokens": 2000,                                    # Pode aumentar para 10k conforme necessário
    "temperature": 0.7,
    "max_iterations": 10,
    "save_folder": "tests",
    "execution_timeout": 5,                                # Timeout em segundos para execução do código
    "final_validation": False                              # Se True, realiza a validação final com o LLM; se False, pula essa etapa
}
# =======================================================

# Histórico global para geração e validação
HISTORY = ""

def extrair_codigo(resposta):
    """
    Tenta extrair o código entre delimitadores (``` ou ```python/javascript).
    Se não encontrar, retorna a resposta completa.
    """
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

def call_llm(prompt):
    """
    Chama o LLM com o prompt fornecido, incluindo o histórico.
    Adiciona logs para debugar a resposta crua.
    """
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
    print("\n[DEBUG] Resposta CRUA do LLM:", json.dumps(raw_response, indent=2))
    resposta = raw_response.get("choices", [{}])[0].get("text", "").strip()
    HISTORY += "\n[User]: " + prompt + "\n[LLM]: " + resposta + "\n"
    return extrair_codigo(resposta)

def call_llm_without_history(prompt):
    """
    Chama o LLM com o prompt fornecido sem histórico, usado para correções.
    """
    payload = {
        "model": CONFIG["model"],
        "prompt": prompt,
        "max_tokens": CONFIG["max_tokens"],
        "temperature": CONFIG["temperature"]
    }
    response = requests.post(CONFIG["llm_url"], json=payload)
    resposta = response.json().get("choices", [{}])[0].get("text", "").strip()
    return extrair_codigo(resposta)

def detect_language(code):
    """
    Tenta detectar se o código é Python ou JavaScript.
    """
    if re.search(r"def |import |print\(", code):
        return "python"
    if re.search(r"function |const |let |console\.log\(", code):
        return "javascript"
    return "unknown"

def get_language(code):
    """
    Retorna o idioma detectado ou, se for unknown, usa o default.
    """
    lang = detect_language(code)
    return lang if lang != "unknown" else CONFIG["default_language"]

def auto_install_module(lang, module_name):
    """
    Tenta instalar automaticamente o módulo ausente usando:
      - pip para Python;
      - npm para JavaScript (usa "npm.cmd" no Windows).
    """
    try:
        if lang == "python":
            print(f"\n⚙️ Tentando instalar o módulo '{module_name}' via pip...")
            result = subprocess.run(["pip", "install", module_name], capture_output=True, text=True)
        elif lang == "javascript":
            npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
            print(f"\n⚙️ Tentando instalar o módulo '{module_name}' via {npm_cmd}...")
            result = subprocess.run([npm_cmd, "install", module_name], capture_output=True, text=True)
        else:
            return False, "Idioma não suportado para instalação automática."
        if result.returncode == 0:
            return True, result.stdout or result.stderr
        else:
            return False, result.stderr or result.stdout
    except Exception as e:
        return False, str(e)

def test_code(code, lang):
    """
    Executa o código na linguagem apropriada e retorna (sucesso, saída/erro).
    Se ocorrer erro de módulo ausente, tenta instalar e reexecuta.
    Usa timeout para evitar travamentos; se o código não terminar em CONFIG['execution_timeout']
    segundos, considera que ele compilou (ou iniciou um servidor) corretamente.
    """
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
                    success_install, install_output = auto_install_module(lang, module_name)
                    if success_install:
                        print(f"✅ Módulo '{module_name}' instalado com sucesso. Re-testando o código...")
                        continue
                    else:
                        return False, f"Falha ao instalar o módulo '{module_name}': {install_output}"
                else:
                    return False, output
            elif lang == "javascript" and "Cannot find module" in output:
                match = re.search(r"Cannot find module '([\w\-/]+)'", output)
                if match:
                    module_name = match.group(1)
                    success_install, install_output = auto_install_module(lang, module_name)
                    if success_install:
                        print(f"✅ Módulo '{module_name}' instalado com sucesso. Re-testando o código...")
                        continue
                    else:
                        return False, f"Falha ao instalar o módulo '{module_name}': {install_output}"
                else:
                    return False, output
            else:
                return False, output
        except Exception as e:
            return False, str(e)

def save_code_file(code, iteration):
    """
    Salva o código em um arquivo na pasta CONFIG['save_folder'] com o nome:
    interacaoX.timestamp.<ext>, onde X é o número da iteração e <ext> é "py" ou "js".
    Imprime o código para avaliação.
    """
    folder = CONFIG["save_folder"]
    os.makedirs(folder, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = "py" if CONFIG["default_language"] == "python" else "js"
    filename = os.path.join(folder, f"interacao{iteration + 1}.{timestamp}.{ext}")
    with open(filename, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"💾 Código salvo em: {filename}\n")
    print("📝 Código gerado:")
    print("----------------------------------------------------")
    print(code)
    print("----------------------------------------------------\n")
    return filename

def auto_gpt_loop(goal, max_iterations):
    iteration = 0
    last_tested_code = ""
    last_error_output = ""
    while iteration < max_iterations:
        print(f"\n🚀 Iteração {iteration + 1}: Gerando código para '{goal}'...")
        prompt = (
            f"Escreva um código {CONFIG['default_language']} válido que resolva o seguinte objetivo: {goal}. "
            "Retorne apenas o código, sem comentários ou explicações extras."
        )
        code = call_llm(prompt)
        save_code_file(code, iteration)
        last_tested_code = code

        lang = get_language(code)
        print(f"🔍 Código detectado como {lang}")
        if lang == "unknown":
            print("❌ Linguagem não reconhecida!")
            return None

        print("🔍 Testando código...")
        success, output = test_code(code, lang)
        
        if success:
            if CONFIG["final_validation"]:
                print("✅ Código compilado com sucesso! Validando com o LLM...")
                validation_prompt = (
                    f"O código abaixo resolve o problema '{goal}' corretamente?\n\n{code}\n\n"
                    "Se sim, responda apenas SIM. Caso contrário, responda NÃO seguido de uma breve explicação do motivo."
                )
                validation = call_llm(validation_prompt)
                print("\n📝 Resposta da validação:", validation)
                if "SIM" in validation.upper():
                    print("\n🎯 Objetivo atingido!\n", code)
                    return code
                else:
                    print("\n❌ O código não satisfaz completamente o objetivo.")
            else:
                print("✅ Código compilado com sucesso! Validação final desativada.")
                return code
        else:
            print("\n❌ Erro de compilação:", output)
        
        last_error_output = output

        print("\nSolicitando correção (usando apenas o último código testado e o erro)...")
        correction_prompt = (
            f"O seguinte código apresentou os erros abaixo:\n\n{last_tested_code}\n\nErro:\n{last_error_output}\n\n"
            "Corrija o código e retorne apenas o código corrigido."
        )
        code = call_llm_without_history(correction_prompt)
        save_code_file(code, iteration)
        last_tested_code = code
        
        iteration += 1
    
    print("\n🚨 Limite de iterações atingido! Última versão do código:\n", last_tested_code)
    return last_tested_code

if __name__ == "__main__":
    if len(sys.argv) > 1:
        goal = " ".join(sys.argv[1:])
    else:
        goal = CONFIG["default_goal"]
    auto_gpt_loop(goal, CONFIG["max_iterations"])
