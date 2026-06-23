import express from 'express';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve a interface visual do index.html
app.use(express.static(__dirname));

// INICIALIZAÇÃO DO MOTOR COM A NOVA CHAVE COMPLETA INJETADA DIRECTO
const groq = new Groq({
  apiKey: "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"
});

// Chave da APILayer vinda do ambiente (caso use no futuro para as ferramentas /print e /valida)
const APILAYER_KEY = process.env.APILAYER_KEY || "";

// ROTA DO CHAT PRINCIPAL (MÁXIMA ESTABILIDADE)
app.post('/chat', async (req, res) => {
  const { mensagens } = req.body;
  
  if (!mensagens || !Array.isArray(mensagens)) {
    return res.json({ status: "erro", resposta: "SINAL INSTÁVEL: Memória de dados corrompida no terminal." });
  }

  try {
    // Chamada ao motor Llama com o token novo
    const chatCompletion = await groq.chat.completions.create({
      messages: mensagens,
      model: "llama-3.1-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const respostaIA = chatCompletion.choices[0]?.message?.content || "";
    res.json({ status: "online", resposta: respostaIA });

  } catch (error) {
    console.error("Erro na requisição da IA:", error);
    // PLANO B: Resposta de contingência limpa se a rede externa oscilar
    res.json({ 
      status: "contingencia", 
      resposta: "SINAL INTERROMPIDO: Instabilidade temporária na rede externa do Core. A operação continua ativa, repita o envio em alguns instantes." 
    });
  }
});

// ROTA DE REQUISIÇÕES DAS FERRAMENTAS APILAYER
app.post('/api/core-tools', async (req, res) => {
  const { ferramenta, parametro } = req.body;
  
  if (!APILAYER_KEY) {
    return res.json({ sucesso: false, erro: "API KEY AUSENTE: Esta ferramenta requer chave APILayer configurada no Render." });
  }
  
  const headers = { "apikey": APILAYER_KEY };

  try {
    if (ferramenta === 'screenshot') {
      const url = `https://api.apilayer.com/screenshotlayer/capture?url=${encodeURIComponent(parametro)}&viewport=1280x800&format=PNG`;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error();
      const buffer = await response.buffer();
      return res.json({ sucesso: true, tipo: 'imagem', resultado: `data:image/png;base64,${buffer.toString('base64')}` });
    }

    if (ferramenta === 'telefone') {
      const response = await fetch(`https://api.apilayer.com/number_verification/validate?number=${encodeURIComponent(parametro)}`, { headers });
      const dados = await response.json();
      const formatado = `VARREDURA TELEFÔNICA:\nLinha: ${dados.valid ? 'ATIVA' : 'INVÁLIDA'}\nNúmero: ${dados.international_format || parametro}\nOperadora: ${dados.carrier || 'DESCONHECIDA'}\nTipo: ${dados.line_type || 'N/A'}`;
      return res.json({ sucesso: true, tipo: 'texto', resultado: formatado });
    }
    
    res.json({ sucesso: false, erro: "Comando inválido de ferramenta." });
  } catch (e) {
    res.json({ sucesso: false, erro: "MANUTENÇÃO DE REDE: Motor tático externo temporariamente indisponível." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SYNAPSE CORE] v21.0 Blindado rodando com sucesso na porta ${PORT}`);
});
