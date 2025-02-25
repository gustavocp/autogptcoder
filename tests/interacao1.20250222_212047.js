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