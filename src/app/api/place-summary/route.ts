import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const name = (body?.name || "").toString().trim();
    if (!name) {
      return NextResponse.json({ error: "Missing place name" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Du bist ein sachlicher Reise-Redakteur. Schreibe kurz, präzise und informativ auf Deutsch.",
          },
          {
            role: "user",
            content: `Schreibe eine neutrale, informative Kurzbeschreibung zu "${name}" in 5-6 Saetzen. Keine Werbung, kein Fülltext, keine Emojis, keine Aufzählung.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 260,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `OpenAI Fehler ${response.status}: ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const summary = (data?.choices?.[0]?.message?.content || "").toString().trim();
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

