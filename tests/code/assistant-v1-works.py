import requests
import subprocess
import re

# URL do LLM rodando no LM Studio (ajuste conforme necessário)
LLM_URL = "http://localhost:1234/v1/completions"

def extrair_codigo(resposta):
    """
    Tenta extrair o código entre delimitadores (``` ou ```python).
    Se não encontrar, retorna a resposta original com limpeza simples.
    """
    # Extrai código entre blocos de crase
    blocos = re.findall(r"```(?:python)?\n(.*?)```", resposta, re.DOTALL)
    if blocos:
        return blocos[0].strip()
    # Caso não haja delimitadores, remove linhas iniciais que indiquem texto extra
    linhas = resposta.splitlines()
    codigo = []
    for linha in linhas:
        # Se a linha contiver keywords comuns de código, inclui na extração
        if re.search(r"^(def |import |print\(|function |const |let |console\.log\()", linha.strip()):
            codigo.append(linha)
    # Se nenhuma linha "code-like" for encontrada, retorna a resposta original
    return "\n".join(codigo).strip() if codigo else resposta.strip()

def call_llm(prompt):
    """
    Chama o LLM com o prompt fornecido e extrai o código da resposta.
    """
    payload = {
        "model": "qwen2.5-coder-3b-instruct",  # substitua pelo nome do seu modelo
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

def test_code(code, lang):
    """
    Executa o código na linguagem apropriada e retorna (sucesso, saída/erro).
    """
    cmd = {
        "python": ["python3", "-c", code],
        "javascript": ["node", "-e", code]
    }.get(lang)

    if not cmd:
        return False, "Linguagem não suportada"

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0, result.stderr or result.stdout
    except Exception as e:
        return False, str(e)

def auto_gpt_loop(goal, max_iterations=10):
    iteration = 0
    while iteration < max_iterations:
        print(f"\n🚀 Iteração {iteration + 1}: Gerando código para '{goal}'...")
        # Prompt ajustado para garantir que o LLM retorne apenas o código válido
        prompt = (
            f"Escreva um código Python válido que resolva o seguinte objetivo: {goal}. "
            "Retorne apenas o código, sem comentários ou explicações extras."
        )
        code = call_llm(prompt)

        lang = detect_language(code)
        print(f"\n🔍 Código detectado como {lang}")

        if lang == "unknown":
            print("\n❌ Linguagem não reconhecida!")
            return None

        print(f"\n🔍 Testando código...")
        success, output = test_code(code, lang)
        
        if success:
            print("\n✅ Código compilado com sucesso! Validando com o LLM...")
            validation_prompt = (
                f"O código abaixo resolve o problema '{goal}' corretamente?\n\n{code}\n\n"
                "Responda apenas SIM ou NÃO."
            )
            validation = call_llm(validation_prompt)
            
            if "SIM" in validation.upper():
                print("\n🎯 Objetivo atingido!\n", code)
                return code
            else:
                print("\n❌ O código não satisfaz completamente o objetivo. Solicitando correção...")
        else:
            print("\n❌ Erro de compilação:", output)
            correction_prompt = (
                f"O seguinte código apresentou erros:\n\n{code}\n\nErro:\n{output}\n\n"
                "Corrija o código e retorne apenas o código corrigido."
            )
            code = call_llm(correction_prompt)
        
        iteration += 1
    
    print("\n🚨 Limite de iterações atingido! Última versão do código:\n", code)
    return code

if __name__ == "__main__":
    auto_gpt_loop("Criar uma função que soma dois números")
