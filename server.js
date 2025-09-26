import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

function cleanSuggestions(rawText) {
    return rawText
        .split("\n")                      // split into lines
        .map(line => line.trim())         // trim whitespace
        .filter(line => line.length > 0)  // remove empty lines
        .map(line => line.replace(/^(\d+\.|\*+)\s*/, "")) // remove numbering and bullets
        .map(line => line.replace(/<\/?[^>]+(>|$)/g, "")) // remove HTML tags
        .map(line => line.replace(/\*\*(.*?)\*\*/g, "$1")) // remove markdown bold **
        .map(line => line.replace(/^\s*-\s*/, ""))        // remove dash bullets
        .filter(line => line.length > 0);  // final filter
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: 'Too many requests, please try again later'
});

app.use(limiter);

app.post("/generate-comments", async (req, res) => {
    const { postText, tone, maxLength } = req.body;
    const origin = req.headers.origin;

    // Validate inputs
    if (!postText || typeof postText !== 'string') {
        return res.status(400).json({ error: 'Invalid post text' });
    }
    if (postText.length > 5000) { // Set reasonable limits
        return res.status(400).json({ error: 'Post text too long' });
    }

    // Only allow requests from LinkedIn
    if (!origin || !origin.includes('linkedin.com')) {
        return res.status(403).json({ error: 'Forbidden' });
    }



    // Call your LLM (OpenAI example)
    const prompt = `Suggest 3 ${tone} LinkedIn comments under ${maxLength} characters for this post:\n"${postText}"`;

    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": process.env.API_KEY,
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
            }),
        }
    );
    const data = await response.json();

    const rawText = data?.candidates?.[0]?.content.parts[0].text || "";
    const suggestions = cleanSuggestions(rawText);

    res.json({ suggestions });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on http://localhost:3000"));


