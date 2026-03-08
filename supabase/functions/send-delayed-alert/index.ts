import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type DelayedRecord = {
  title: string;
  owner_department: string;
  partner_department: string | null;
  due_date: string;
  status: string;
};

function formatDepartmentLabel(
  ownerDepartment: string,
  partnerDepartment: string | null,
) {
  if (partnerDepartment && partnerDepartment.trim() !== '') {
    return `${ownerDepartment} · ${partnerDepartment}`;
  }

  return ownerDepartment;
}

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const googleChatWebhookUrl = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase 환경변수가 설정되지 않았습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!googleChatWebhookUrl) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_CHAT_WEBHOOK_URL이 설정되지 않았습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data, error } = await supabase
      .from('execution_record')
      .select('title, owner_department, partner_department, due_date, status')
      .eq('status', '지연')
      .order('due_date', { ascending: true });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const delayedRecords = (data ?? []) as DelayedRecord[];

    if (delayedRecords.length === 0) {
      return new Response(
        JSON.stringify({ message: '지연된 보안 활동이 없습니다.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const lines = delayedRecords.map((item, index) => {
      const departmentLabel = formatDepartmentLabel(
        item.owner_department,
        item.partner_department,
      );

      return `${index + 1}. ${item.title} / ${departmentLabel} / 기한 ${String(
        item.due_date,
      ).slice(0, 7)}`;
    });

    const message = {
      text: `보안 활동 지연 알림\n\n총 ${delayedRecords.length}건의 지연 활동이 있습니다.\n\n${lines.join('\n')}`,
    };

    const chatResponse = await fetch(googleChatWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!chatResponse.ok) {
      const chatText = await chatResponse.text();

      return new Response(
        JSON.stringify({
          error: 'Google Chat 전송 실패',
          detail: chatText,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Google Chat 알림 전송 완료',
        count: delayedRecords.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});