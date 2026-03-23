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

    console.log('[send-delayed-alert] function started');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[send-delayed-alert] missing supabase env');
      return new Response(
        JSON.stringify({ error: 'Supabase 환경변수가 설정되지 않았습니다.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!googleChatWebhookUrl) {
      console.error('[send-delayed-alert] missing GOOGLE_CHAT_WEBHOOK_URL');
      return new Response(
        JSON.stringify({ error: 'GOOGLE_CHAT_WEBHOOK_URL이 설정되지 않았습니다.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    console.log('[send-delayed-alert] webhook configured');

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error: syncError } = await supabase.rpc('mark_delayed_execution_records');

    if (syncError) {
      console.error('[send-delayed-alert] delayed sync error:', syncError.message);
      return new Response(
        JSON.stringify({ error: syncError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { data, error } = await supabase
      .from('execution_record')
      .select('title, owner_department, partner_department, due_date, status')
      .eq('status', '지연')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('[send-delayed-alert] query error:', error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const delayedRecords = (data ?? []) as DelayedRecord[];
    console.log(`[send-delayed-alert] delayed record count: ${delayedRecords.length}`);

    if (delayedRecords.length === 0) {
      return new Response(
        JSON.stringify({ message: '지연된 보안 활동이 없습니다.' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const lines = delayedRecords.map((item, index) => {
      const departmentLabel = formatDepartmentLabel(
        item.owner_department,
        item.partner_department,
      );

      const dueMonth = String(item.due_date).slice(0, 7);

      return `${index + 1}. ${item.title} / ${departmentLabel} / 활동월 ${dueMonth}`;
    });

    const messageText = [
      '보안 활동 지연 알림',
      '',
      `총 ${delayedRecords.length}건의 지연 활동이 있습니다.`,
      '',
      ...lines,
    ].join('\n');

    console.log('[send-delayed-alert] sending message to google chat');

    const chatResponse = await fetch(googleChatWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: messageText,
      }),
    });

    const chatResponseText = await chatResponse.text();
    console.log('[send-delayed-alert] google chat status:', chatResponse.status);
    console.log('[send-delayed-alert] google chat response:', chatResponseText);

    if (!chatResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'Google Chat 전송 실패',
          detail: chatResponseText,
          status: chatResponse.status,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Google Chat 알림 전송 완료',
        count: delayedRecords.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('[send-delayed-alert] unexpected error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
