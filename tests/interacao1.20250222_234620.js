const express = require('express');
const app = express();

// Documentação do endpoint /ping
app.get('/ping', (req, res) => {
    // Definição formal do problema:
    // Dado um número inteiro N, defina uma função f(N) que retorne f(N-1) + (-1)^N * 2^(N+1), com f(0)=0.
    // Se N for negativo, retorne 0.
    const N = parseInt(req.query.N);
    
    if (N < 0) {
        res.status(400).json({ message: 'Number must be non-negative' });
        return;
    }
    
    let result = 0;
    for (let i = 0; i <= N; i++) {
        const sign = Math.pow(-1, i);
        const term = sign * Math.pow(2, i + 1);
        result += term;
    }
    
    res.status(200).json({ value: result });
});

// Script de testes para a API
const ts = require('testing');
const describe('Ping API', () => {
    beforeEach(() => {
        app.listen().on('ping', (res) => console.log(res));
    });

    it('deverá retornar 0 para N=0', () => {
        const response = await fetch('/ping?N=0');
        expect(response.json()).toEqual(0);
    });

    it('deberá retornar 2 para N=1', () => {
        const response = await fetch('/ping?N=1');
        expect(response.json()).toEqual(2);
    });

    it('deberá retornar -4 para N=2', () => {
        const response = await fetch('/ping?N=2');
        expect(response.json()).toEqual(-4);
    });

    it('deberá retornar 8 para N=3', () => {
        const response = await fetch('/ping?N=3');
        expect(response.json()).toEqual(8);
    });

    afterEach(() => {
        app.listen().on('ping', (res) => console.log(res));
    });
});