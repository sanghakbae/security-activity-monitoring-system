import { useMemo, useState } from 'react';
import type { SecuritySettings } from '@/types';

type SecuritySettingsPageProps = {
  settings: SecuritySettings;
  onChange: (next: SecuritySettings) => void;
  onSave: (next: SecuritySettings) => Promise<void>;
};

export default function SecuritySettingsPage({
  settings,
  onChange,
  onSave,
}: SecuritySettingsPageProps) {
  const [saving, setSaving] = useState(false);

  const normalizeAllowedEmailDomainsText = (value: string) => {
    const unique = Array.from(
      new Set(
        value
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter((item) => item !== ''),
      ),
    );

    return unique.join(', ');
  };

  const alertTimesText = useMemo(
    () => settings.googleChatAlertTimes.join(', '),
    [settings.googleChatAlertTimes],
  );

  const handleSave = async () => {
    try {
      setSaving(true);

      const normalizedDomain = normalizeAllowedEmailDomainsText(settings.allowedEmailDomain);
      const timeout = Math.max(5, Math.min(10080, Math.floor(settings.sessionTimeoutMinutes)));
      const normalizedTimes = settings.googleChatAlertTimes
        .map((item) => item.trim())
        .filter((item) => /^([01]\d|2[0-3]):[0-5]\d$/.test(item));

      const payload: SecuritySettings = {
        allowedEmailDomain: normalizedDomain,
        sessionTimeoutMinutes: timeout,
        googleChatAlertTimes: normalizedTimes,
      };

      if (!payload.allowedEmailDomain) {
        window.alert('허용 이메일 도메인을 입력해 주세요.');
        return;
      }

      if (payload.googleChatAlertTimes.length === 0) {
        window.alert('구글챗 알람 시간을 최소 1개 이상 입력해 주세요. (예: 14:00, 19:00)');
        return;
      }

      await onSave(payload);
      onChange(payload);
      window.alert('보안 설정이 저장되었습니다.');
    } catch (error) {
      console.error('saveSecuritySettings error:', error);
      window.alert(
        error instanceof Error
          ? `보안 설정 저장 오류: ${error.message}`
          : '보안 설정 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="mb-3 border-b border-slate-100 pb-2">
        <div className="text-[16px] font-semibold">보안 설정</div>
        <div className="mt-1 text-sm text-slate-500">
          로그인 허용 도메인, 세션 만료 시간, 구글챗 알람 시간을 설정합니다.
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-slate-800">
            허용 이메일 도메인
          </label>
          <input
            value={settings.allowedEmailDomain}
            onChange={(e) =>
              onChange({
                ...settings,
                allowedEmailDomain: e.target.value,
              })
            }
            className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[13px] outline-none"
            placeholder="예: muhayu.com, gmail.com"
          />
          <p className="mt-2 text-xs text-slate-400">여러 도메인은 쉼표(,)로 구분해 입력하세요.</p>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-slate-800">
            세션 만료 시간 (분)
          </label>
          <input
            type="number"
            min={5}
            max={10080}
            value={settings.sessionTimeoutMinutes}
            onChange={(e) =>
              onChange({
                ...settings,
                sessionTimeoutMinutes: Number(e.target.value || 60),
              })
            }
            className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[13px] outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-slate-800">
            구글챗 알람 시간 (HH:MM, 쉼표 구분)
          </label>
          <input
            value={alertTimesText}
            onChange={(e) =>
              onChange({
                ...settings,
                googleChatAlertTimes: e.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter((item) => item !== ''),
              })
            }
            className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[13px] outline-none"
            placeholder="예: 14:00, 19:00"
          />
          <p className="mt-2 text-xs text-slate-400">
            현재 스케줄 워크플로 기준시간(KST)과 함께 운영하세요.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-slate-900 px-2.5 py-1.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </section>
  );
}
