const express = require('express');
const http = require('http');
const WebSocket = require('socket.io getNode');
const { readFileSync, writeFileSync } = require('fs');
const { createEncryptTransform, createDecryptTransform } = require('crypto');

const app = express();

// Configurações da API
app.use(express.json());

// Variáveis globais para armazenar dados
let receivedData = null;
let sendData = null;

// Inicialização do Socket.IO
const io = new WebSocket('http://localhost:8080/ws');
const ws = io.on('ws');

// Função para conexão do cliente
io.on('connect', (event) => {
    console.log('Conectado ao socket...');
    
    // Mantém a conexão aberta para sincronização
    const ws.on('close', () => {
        event.preventDefault();
        console.log('Conexão estourada. Tentando reconnectar...');
        
        io.connect('http://localhost:8080/ws');
        event.stopPropagation();
    });

    // Re却信, envia um signal para o servidor
    sendData = new Promise((resolve) => {
        const response = io.emit({ type: 'reconnect' });
        console.log('Emitindo signal de reconnectação...');
        
        setTimeout(() => {
            ws.on('close', () => {
                ws.close();
                ws = io.on('ws');
            });
            
            event.preventDefault();
            console.log('Reconexão automatizada com sucesso.');
        }, 1000);
    });

    // Recibe dados do cliente
    ws.on('message', (message) => {
        receivedData = message.data;
        console.log('Dados recebidos:', receivedData);
        
        if (receivedData !== null) {
            sendData.forEach((data, index) => {
                const transformed = createEncryptTransform();
                const encrypted = transformed.encrypt(data);
                
                writeFileSync(index + '.encrypted', encrypted);
                
                const decrypted = transformed.decrypt(encrypted);
                console.log('Dado enviar para o servidor:', data);
                io.emit({ type: 'push', data });
            });
        }
    });

    // Sincroniza os streams
    ws.on('close', () => {
        if (receivedData !== null) {
            const stream = require('stream-shift');
            
            const shiftedStream = stream.createShiftedVersion(
                () => writeFileSync,
                () => readFileSync,
                () => () => createDecryptTransform()
            );
            
            shiftedStream.observe(receivedData);
            
            console.log('Conexão encerrada. Observando streams...');
        }
    });
});

// Função para armazenar dados
async function saveData(data) {
    try {
        writeFileSync('userData', JSON.stringify({ id: Date.now(), nome: data.name, valor: data.valor }));
        console.log('Dados armazenados com sucesso.');
    } catch (error) {
        console.error('Erro ao armazenar dados:', error);
    }
}

// Função para carregar dados
async function loadData() {
    try {
        const contents = readFileSync('userData');
        const userData = JSON.parse(contents);
        console.log('Dados carregados:', userData);
        return userData;
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Serve o socket
io.serve T => () => {
    console.log('Servidor de sockets em rodendo...');
    
    // Define a porta para receber conexões
    const serverPort = 8080;
    
    // Inicia o servidor do socket.io
    const serve = () => io.serve();
    serve().start({ host: 'localhost', port: serverPort });
    
    // Mantém um laço para accepting connections
    io.on('accept', (event) => {
        event.preventDefault();
        console.log(`Conectado por ${eventiple} (${event.srcPort})`);
        
        // Configura o WebSocket local
        const ws = new WebSocket(`ws://localhost:${serverPort}`);
        ws.on('message', () => {
            io.emit({ type: 'push', data: event.data });
        });
        
        // Inicia a sincronização
        ws.on('close', () => {
            ws.close();
            ws = new WebSocket(`ws://localhost:${serverPort}`);
            
            // Emite um signal para o servidor
            io.emit({ type: 'reconnect' });
        });
    });
    
    // Loop infinito para aceitar conexões
    io.run().start().catch(error => {
        console.error('Erro ao inicuar o servidor:', error);
    });
}

// Inicializa o main
const main = () => {
    try {
        const app = express();
        
        // Define o end-point para a API
        app.get('/api', (req, res) => {
            res.json({ type: 'API está ativa' });
        });

        // Serve o servidor
        io.serve().start().listen().serveMainLoop().catch(error => {
            console.error('Erro ao inicuar o servidor:', error);
        });
    } catch (error) => {
        console.error('Erro no main:', error);
    }
};

// Inicia o servidor
main();