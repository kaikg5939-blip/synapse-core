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

app.use(express.static(__dirname));

// Inicialização segura da Groq
let groq = null;
try {
  const apiKey = process.env.GROQ_API_KEY || "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";
  groq = new Groq({ apiKey });
} catch (e) {
  console.error("Falha ao iniciar o cliente Groq:", e);
}

const APILAYER_KEY = process.env.APILAYER_KEY || "";

// ROTA DO CHAT (BLINDAGEM CONTRA QUEDAS)
app.post('/chat', async (req, res) => {
  const { mensagens } = req.body;
  
  if (!mensagens || !Array.isArray(mensagens)) {
    return res.json({ status: "erro", resposta: "SINAL INSTÁVEL: O terminal está reestabelecendo a fiação local." });
  }

  // PLANO B: Se o motor da Groq estiver totalmente fora do ar
  if (!groq) {
    return res.json({ 
      status: "contingencia", 
      resposta: "CONEXÃO RESTRITA: O motor principal está indisponível no momento. Tente enviar sua requisição novamente mais tarde." 
    });
  }

  try {
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
    // PLANO B de rede: Devolve resposta limpa de sistema em vez de quebrar a tela
    res.json({ 
      status: "contingencia", 
      resposta: "SINAL INTERROMPIDO: Instabilidade na rede externa do Core. A operação continua ativa, tente novamente em alguns instantes." 
    });
  }
});

// ROTA DE FERRAMENTAS APILAYER RESTRITAS
app.post('/api/core-tools', async (req, res) => {
  const { ferramenta, parametro } = req.body;
  
  if (!APILAYER_KEY) {
    return res.json({ sucesso: false, erro: "API KEY AUSENTE: Esta ferramenta requer chave APILayer no servidor." });
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
    
    res.json({ sucesso: false, erro: "Comando inválido." });
  } catch (e) {
    res.json({ sucesso: false, erro: "MANUTENÇÃO DE REDE: Motor de busca externo temporariamente indisponível." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SYNAPSE CORE] v21.0 Blindado rodando na porta ${PORT}`);
});
