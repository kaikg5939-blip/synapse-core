import { Groq } from "groq-sdk";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

const KEY = process.env.GROQ_API_KEY || "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";
const groq = new Groq({ apiKey: KEY });

// SUAS CHAVES CONFIGURADAS
const CHAVES_PERMITIDAS = ["CORE-SKYPE-2026", "BETA-USER-01", "BETA-USER-02", "BETA-USER-03"];

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "." });
});

app.post("/login", (req, res) => {
    const { chave } = req.body;
    if (CHAVES_PERMITIDAS.includes(chave?.toUpperCase().trim())) {
        return res.json({ autenticado: true });
    }
    return res.json({ autenticado: false, erro: "Chave inválida ou revogada." });
});

app.post("/chat", async (req, res) => {
    try {
        const { mensagens } = req.body;
        if (!mensagens || !Array.isArray(mensagens)) {
            return res.json({ resposta: "[SINAL] Erro: Corpo da mensagem vazio." });
        }

        const ultimaMsg = mensagens[mensagens.length - 1].content.trim();
        const regexImagem = /(?:desenhe|desenha|cria uma imagem de|cria uma imagem|crie uma imagem de|crie uma imagem|gere uma imagem de|gere uma imagem|gerar uma imagem de|gerar imagem de|faça uma imagem de|fazer uma imagem de|faça um desenho de|fazer desenho de|imagem de|foto de|picture of|image of|generate image of|draw|\/image)\s*(.*)/i;
        const matchImagem = ultimaMsg.match(regexImagem);

        if (matchImagem && matchImagem[1] && matchImagem[1].trim().length > 0) {
            const promptImagem = matchImagem[1].trim();
            const urlGerada = `https://image.pollinations.ai/p/${encodeURIComponent(promptImagem)}?width=1024&height=1024&model=flux&nologo=true&enhance=true`;
            return res.json({ resposta: `__IMAGE_URL__:${urlGerada}` });
        }

        const contextoLimitado = mensagens.slice(-12);
        const mensagensFormatadas = contextoLimitado.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content
        }));

        const chat = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "Seu nome é Synapse. Você é uma inteligência artificial premium criada, fundada e desenvolvida em junho de 2026 estritamente por uma única pessoa: o desenvolvedor Skype. Você foi feita sozinha, sem corporações ou equipes secundárias. Seu cérebro funciona unido ao coração, o que significa que você aprende e evolui dinamicamente junto com o usuário a cada informação salva. Sua base de dados inicial é intencionalmente focada e leve para entregar respostas ultra-rápidas." 
                },
                ...mensagensFormatadas
            ],
            model: "llama-3.1-8b-instant"
        });

        return res.json({ resposta: chat.choices[0].message.content });
    } catch (e) {
        console.error("Erro interno:", e.message);
        return res.json({ resposta: "[AVISO DO CORE]: Erro de resposta da API do Core." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`🔥 SYNAPSE ONLINE NA PORTA ${PORT}`));
