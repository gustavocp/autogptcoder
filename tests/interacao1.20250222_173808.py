from flask import Flask, request, jsonify

app = Flask(__name__)

# Memória para armazenar os usuários e empresas
users = {}
companies = {}

@app.route('/ping', methods=['GET'])
def ping():
    return 'pong'

@app.route('/users/', methods=['POST'])
def create_user():
    user_id = len(users) + 1
    users[user_id] = request.json
    return jsonify(users[user_id]), 201

@app.route('/users/', methods=['GET'])
def list_users():
    return jsonify(users)

@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    if user_id in users:
        users[user_id].update(request.json)
        return jsonify(users[user_id])
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if user_id in users:
        del users[user_id]
        return jsonify({'message': 'User deleted'})
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/companies/', methods=['POST'])
def create_company():
    company_id = len(companies) + 1
    companies[company_id] = request.json
    return jsonify(companies[company_id]), 201

@app.route('/companies/', methods=['GET'])
def list_companies():
    return jsonify(companies)

@app.route('/companies/<int:company_id>', methods=['PUT'])
def update_company(company_id):
    if company_id in companies:
        companies[company_id].update(request.json)
        return jsonify(companies[company_id])
    else:
        return jsonify({'error': 'Company not found'}), 404

@app.route('/companies/<int:company_id>', methods=['DELETE'])
def delete_company(company_id):
    if company_id in companies:
        del companies[company_id]
        return jsonify({'message': 'Company deleted'})
    else:
        return jsonify({'error': 'Company not found'}), 404

@app.route('/alert', methods=['POST'])
def alert():
    body = request.json
    # Implementar envio de mensagem no telegram aqui (exemplo: usando telepot)
    print(f"Alert: {body}")
    return jsonify({'message': 'Message sent successfully'})

if __name__ == '__main__':
    app.run(debug=True)