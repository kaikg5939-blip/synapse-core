import express from 'express';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Certifique-se de ter instalado caso sua versao do node seja antiga

dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "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"
});

// Chave unificada da APILayer vinda do ambiente ou inserida diretamente de forma segura
const APILAYER_KEY = process.env.APILAYER_KEY || "SUA_CHAVE_APILAYER_AQUI";

// ROTA TÁTICA: EXECUÇÃO DE FERRAMENTAS APILAYER UNIFICADAS
app.post('/api/core-tools', async (req, res) => {
  const { ferramenta, parametro } = req.body;
  const headers = { "apikey": APILAYER_KEY };

  try {
    if (ferramenta === 'screenshot') {
      // Screenshotlayer - Captura de Tela Dinâmica
      const url = `https://api.apilayer.com/screenshotlayer/capture?url=${encodeURIComponent(parametro)}&viewport=1280x800&format=PNG`;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error();
      const buffer = await response.buffer();
      const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;
      return res.json({ sucesso: true, tipo: 'imagem', resultado: base64Image });
    }

    if (ferramenta === 'telefone') {
      // Numverify - Varredura de Operadora e Linha
      const url = `https://api.apilayer.com/number_verification/validate?number=${encodeURIComponent(parametro)}`;
      const response = await fetch(url, { headers });
      const dados = await response.json();
      const formatado = `VARREDURA TELEFÔNICA:\nLinha: ${dados.valid ? 'ATIVA' : 'INVÁLIDA'}\nNúmero: ${dados.international_format || parametro}\nOperadora: ${dados.carrier || 'DESCONHECIDA'}\nTipo: ${dados.line_type || 'N/A'}\nPaís: ${dados.country_name || 'N/A'}`;
      return res.json({ sucesso: true, tipo: 'texto', resultado: formatado });
    }

    if (ferramenta === 'ip') {
      // IPstack - Geolocalização Avançada de Auditoria
      const url = `https://api.apilayer.com/ipstack/${encodeURIComponent(parametro)}`;
      const response = await fetch(url, { headers });
      const dados = await response.json();
      const formatado = `RASTREAMENTO DE PERIFÉRICO:\nIP: ${dados.ip}\nCidade: ${dados.city || 'N/A'}\nEstado: ${dados.region_name || 'N/A'}\nPaís: ${dados.country_name || 'N/A'}\nContinente: ${dados.continent_name || 'N/A'}`;
      return res.json({ sucesso: true, tipo: 'texto', resultado: formatado });
    }

    if (ferramenta === 'cambio') {
      // Fixer - Monitor de Câmbio de Moedas
      const url = `https://api.apilayer.com/fixer/latest?symbols=BRL,EUR&base=USD`;
      const response = await fetch(url, { headers });
      const dados = await response.json();
      const usdToBrl = dados.rates?.BRL ? (dados.rates.BRL).toFixed(2) : 'N/A';
      const usdToEur = dados.rates?.EUR ? (dados.rates.EUR).toFixed(2) : 'N/A';
      const formatado = `MONITOR DE MERCADO:\nBase: 1 USD\nReal (BRL): R$ ${usdToBrl}\nEuro (EUR): € ${usdToEur}`;
      return res.json({ sucesso: true, tipo: 'texto', resultado: formatado });
    }

    res.status(400).json({ erro: "Comando de ferramenta inválido." });
  } catch (error) {
    res.status(500).json({ erro: "Erro na requisição externa da APILayer." });
  }
});

app.post('/chat', async (req, res) => {
  const { mensagens } = req.body;
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: mensagens,
      model: "llama-3.1-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });
    res.json({ resposta: chatCompletion.choices[0]?.message?.content || "" });
  } catch (error) {
    res.status(500).json({ resposta: "FALHA NO SINAL: Erro na autenticação com o motor." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SYNAPSE CORE] Sistema v20.1 rodando com APILayer na porta ${PORT}`);
});
