import requests
import subprocess
import re
import os
from datetime import datetime

# URL do LLM rodando no LM Studio (ajuste conforme necessário)
LLM_URL = "http://localhost:1234/v1/completions"

def extrair_codigo(resposta):
    """
    Tenta extrair o código entre delimitadores (``` ou ```python).
    Se não encontrar, retorna a resposta original com uma limpeza simples.
    """
    blocos = re.findall(r"```(?:python)?\n(.*?)```", resposta, re.DOTALL)
    if blocos:
        return blocos[0].strip()
    linhas = resposta.splitlines()
    codigo = []
    for linha in linhas:
        if re.search(r"^(def |import |print\(|function |const |let |console\.log\()", linha.strip()):
            codigo.append(linha)
    return "\n".join(codigo).strip() if codigo else resposta.strip()

def call_llm(prompt):
    """
    Chama o LLM com o prompt fornecido e extrai o código da resposta.
    """
    payload = {
        "model": "your-model-name",  # substitua pelo nome do seu modelo
        "prompt": prompt,
        "max_tokens": 300,
        "temperature": 0.7
    }
    response = requests.post(LLM_URL, json=payload)
    resposta = response.json().get("choices", [{}])[0].get("text", "").strip()
    return extrair_codigo(resposta)

def detect_language(code):
    """
    Detecta se o código é Python ou JavaScript baseado em padrões simples.
    """
    if re.search(r"def |import |print\(", code):
        return "python"
    if re.search(r"function |const |let |console\.log\(", code):
        return "javascript"
    return "unknown"

def auto_install_module(module_name):
    """
    Tenta instalar automaticamente o módulo ausente usando pip.
    Retorna (True, output) em caso de sucesso ou (False, error) em caso de falha.
    """
    try:
        print(f"\n⚙️ Tentando instalar o módulo '{module_name}' automaticamente...")
        result = subprocess.run(["pip", "install", module_name], capture_output=True, text=True)
        if result.returncode == 0:
            return True, result.stdout or result.stderr
        else:
            return False, result.stderr or result.stdout
    except Exception as e:
        return False, str(e)

def test_code(code, lang):
    """
    Executa o código na linguagem apropriada e retorna (sucesso, saída/erro).
    Se ocorrer um erro de módulo ausente em código Python, tenta instalar o módulo e reexecuta.
    """
    cmd = {
        "python": ["python3", "-c", code],
        "javascript": ["node", "-e", code]
    }.get(lang)

    if not cmd:
        return False, "Linguagem não suportada"

    while True:
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            output = result.stderr or result.stdout

            # Se o código executar com sucesso, retorna
            if result.returncode == 0:
                return True, output

            # Se for Python e houver erro de módulo ausente, tenta instalar o módulo
            if lang == "python" and "ModuleNotFoundError" in output:
                match = re.search(r"No module named '([\w\-]+)'", output)
                if match:
                    module_name = match.group(1)
                    success_install, install_output = auto_install_module(module_name)
                    if success_install:
                        print(f"✅ Módulo '{module_name}' instalado com sucesso. Re-testando o código...")
                        continue  # Reexecuta o código após a instalação
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
    Salva o código em um arquivo na pasta 'tests' com o nome no formato:
    interacaoX.timestamp.py, onde X é o número da iteração.
    """
    folder = "tests"
    os.makedirs(folder, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(folder, f"interacao{iteration + 1}.{timestamp}.py")
    with open(filename, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"💾 Código salvo em: {filename}")

def auto_gpt_loop(goal, max_iterations=10):
    iteration = 0
    while iteration < max_iterations:
        print(f"\n🚀 Iteração {iteration + 1}: Gerando código para '{goal}'...")
        prompt = (
            f"Escreva um código Python válido que resolva o seguinte objetivo: {goal}. "
            "Retorne apenas o código, sem comentários ou explicações extras."
        )
        code = call_llm(prompt)
        save_code_file(code, iteration)
        
        # Imprime o código gerado no console para facilitar a avaliação
        print("\n📝 Código gerado:")
        print("----------------------------------------------------")
        print(code)
        print("----------------------------------------------------\n")

        lang = detect_language(code)
        print(f"🔍 Código detectado como {lang}")

        if lang == "unknown":
            print("❌ Linguagem não reconhecida!")
            return None

        print("🔍 Testando código...")
        success, output = test_code(code, lang)
        
        if success:
            print("✅ Código compilado com sucesso! Validando com o LLM...")
            validation_prompt = (
                f"O código abaixo resolve o problema '{goal}' corretamente?\n\n{code}\n\n"
                "Responda apenas SIM ou NÃO."
            )
            validation = call_llm(validation_prompt)
            
            if "SIM" in validation.upper():
                print("🎯 Objetivo atingido!")
                print("📝 Código final:")
                print("----------------------------------------------------")
                print(code)
                print("----------------------------------------------------\n")
                return code
            else:
                print("❌ O código não satisfaz completamente o objetivo. Solicitando correção...")
        else:
            print("❌ Erro de compilação:", output)
            correction_prompt = (
                f"O seguinte código apresentou erros:\n\n{code}\n\nErro:\n{output}\n\n"
                "Corrija o código e retorne apenas o código corrigido."
            )
            code = call_llm(correction_prompt)
            save_code_file(code, iteration)
            print("\n📝 Código corrigido:")
            print("----------------------------------------------------")
            print(code)
            print("----------------------------------------------------\n")
        
        iteration += 1
    
    print("🚨 Limite de iterações atingido! Última versão do código:")
    print("----------------------------------------------------")
    print(code)
    print("----------------------------------------------------\n")
    return code

if __name__ == "__main__":
    auto_gpt_loop("Criar uma api com fast api que tenha um método /ping e retorne pong")
