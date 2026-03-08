import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CHAT_WEBHOOK = Deno.env.get("CHAT_WEBHOOK")!;

serve(async () => {
  try {
    console.log("send-delayed-alert started");
    console.log("CHAT_WEBHOOK exists:", Boolean(CHAT_WEBHOOK));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("execution_record")
      .select("title, department, due_date, status")
      .eq("status", "지연")
      .order("due_date", { ascending: true });

    if (error) {
      console.error("query error:", error);
      return new Response(error.message, { status: 500 });
    }

    console.log("delayed rows:", data?.length ?? 0);

    if (!data || data.length === 0) {
      return new Response("no delayed tasks", { status: 200 });
    }

    const text = [
      "🚨 보안 활동 지연 알림",
      "",
      `지연된 활동이 ${data.length}건 있습니다.`,
      "",
      ...data.map(
        (item, index) =>
          `${index + 1}. ${item.title} / ${item.department} / 기한 ${String(item.due_date).slice(0, 7)}`
      ),
      "",
      "확인 후 수행 내역 및 증적을 등록해주세요.",
    ].join("\n");

    const chatResponse = await fetch(CHAT_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ text }),
    });

    const chatBody = await chatResponse.text();

    console.log("chat status:", chatResponse.status);
    console.log("chat body:", chatBody);

    if (!chatResponse.ok) {
      return new Response(`chat webhook failed: ${chatResponse.status} ${chatBody}`, {
        status: 500,
      });
    }

    return new Response("sent", { status: 200 });
  } catch (error) {
    console.error("function error:", error);
    return new Response(String(error), { status: 500 });
  }
});