import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type DelayedRecord = {
  title: string;
  owner_department: string;
  partner_department: string | null;
  due_date: string;
  status: string;
};

type SecuritySettingRow = {
  google_chat_alert_times: string[] | null;
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

function getKstParts(now: Date) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(now);
  const find = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: find('year'),
    month: find('month'),
    day: find('day'),
    hour: find('hour'),
    minute: find('minute'),
    weekday: find('weekday'),
  };
}

async function isKoreanHoliday(dateText: string, year: string) {
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
    if (!response.ok) {
      console.log('[send-delayed-alert] holiday api failed status:', response.status);
      return false;
    }

    const holidays = (await response.json()) as Array<{ date?: string }>;
    return holidays.some((item) => item?.date === dateText);
  } catch (error) {
    console.log('[send-delayed-alert] holiday api error:', error);
    return false;
  }
}

Deno.serve(async (request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const googleChatWebhookUrl = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL') ?? '';
    const forceSend = new URL(request.url).searchParams.get('force_send') === 'true';

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
    const now = new Date();
    const kst = getKstParts(now);
    const nowHm = `${kst.hour}:${kst.minute}`;
    const today = `${kst.year}-${kst.month}-${kst.day}`;
    const isWeekend = kst.weekday === 'Sat' || kst.weekday === 'Sun';

    const { data: securityRows, error: securityError } = await supabase
      .from('security_setting')
      .select('google_chat_alert_times')
      .order('created_at', { ascending: true })
      .limit(1);

    if (securityError) {
      console.error('[send-delayed-alert] security_setting query error:', securityError.message);
      return new Response(
        JSON.stringify({ error: securityError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const securityRow = (securityRows?.[0] ?? null) as SecuritySettingRow | null;
    const configuredTimes = Array.isArray(securityRow?.google_chat_alert_times)
      ? securityRow!.google_chat_alert_times
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .filter((value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
      : [];

    const effectiveTimes = configuredTimes.length > 0 ? configuredTimes : ['14:00', '19:00'];
    const holiday = await isKoreanHoliday(today, kst.year);
    const shouldSendByTime = effectiveTimes.includes(nowHm);

    if (!forceSend) {
      if (isWeekend) {
        return new Response(
          JSON.stringify({ message: '주말이라 발송하지 않습니다.', now_hm: nowHm }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (holiday) {
        return new Response(
          JSON.stringify({ message: '공휴일이라 발송하지 않습니다.', date: today }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (!shouldSendByTime) {
        return new Response(
          JSON.stringify({
            message: '설정 시간과 일치하지 않아 발송하지 않습니다.',
            now_hm: nowHm,
            configured_times: effectiveTimes,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    const targetYear = Number(kst.year);
    const targetYearStart = `${targetYear}-01-01`;
    const targetYearEnd = `${targetYear}-12-31`;
    const currentMonthStart = `${targetYear}-${kst.month}-01`;

    const { data, error } = await supabase
      .from('execution_record')
      .select('title, owner_department, partner_department, due_date, status')
      .neq('status', '완료')
      .lt('due_date', currentMonthStart)
      .gte('due_date', targetYearStart)
      .lte('due_date', targetYearEnd)
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
      `보안 활동 지연 알림 (${targetYear}년 대상)`,
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
