import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/generate-comments", async (req, res) => {

    console.log("🚀 ~ req.body:", req.body)
    const { postText, tone, maxLength } = req.body;

    // Call your LLM (OpenAI example)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant for LinkedIn comments." },
                { role: "user", content: `Suggest 3 ${tone} comments within ${maxLength} chars for:\n${postText}` }
            ],
            max_tokens: 300
        })
    });
    const data = await response.json();
    res.json(data);
});

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
