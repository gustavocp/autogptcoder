import cv2

# Função para detectar rostos na imagem
def detect_rostos(imagem):
    # Converte a imagem para grayscale
    gray = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
    
    # Aplica o operador HoughLinesP para detectar as bordas do rosto
    lines = cv2.HoughLinesP(gray, 1.0, 0.3, 50, minLineLength=40, maxLineGap=10)
    
    # Lista de pontos onde foram encontradas as bordas do rosto
    rostos = [pt for pt in lines]
    
    return rostos

# Exemplo de uso da função
imagem = cv2.imread('rosto.jpg')
rostos = detect_rostos(imagem)

for rostro in rostos:
    print(rostro)