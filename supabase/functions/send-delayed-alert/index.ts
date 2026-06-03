Deno.serve(() => {
  console.log('[send-delayed-alert] disabled: Google Chat notifications are turned off');

  return new Response(
    JSON.stringify({
      message: 'Google Chat 지연 알림은 비활성화되어 있습니다.',
      enabled: false,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
