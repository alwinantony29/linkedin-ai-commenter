import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
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


app.post("/generate-comments", async (req, res) => {
    const { postText, tone, maxLength } = req.body;

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

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));

//     curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
//   -H 'Content-Type: application/json' \
//   -H 'X-goog-api-key: AIzaSyDjO0qNowmCJPOJt9MyiIX6xNaTlTBzHac' \
//   -X POST \
//   -d '{
//     "contents": [
//       {
//         "parts": [
//           {
//             "text": "Explain how AI works in a few words"
//           }
//         ]
//       }
//     ]
//   }'
// const response = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
//     },
//     body: JSON.stringify({
//         model: "gpt-3.5",
//         messages: [
//             { role: "system", content: "You are a helpful assistant for LinkedIn comments." },
//             { role: "user", content: `Suggest 3 ${tone} comments within ${maxLength} chars for:\n${postText}` }
//         ],
//         max_tokens: 300
//     })
// });
