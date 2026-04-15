import type { ClassifiedDevice } from '../../hooks/useDeviceDetection';

export type ConnectionBadge = 'USB' | 'WiFi' | 'Nativo' | null;

export interface DeviceSelectorProps {
  classifiedDevices: ClassifiedDevice[];
  selectedDeviceId: string | null;
  onChange: (deviceId: string) => void;
  connectionBadge?: ConnectionBadge;
}

const BADGE_STYLES: Record<NonNullable<ConnectionBadge>, string> = {
  USB: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
  WiFi: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
  Nativo: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
};

function Badge({ kind }: { kind: ConnectionBadge }) {
  if (!kind) return null;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${BADGE_STYLES[kind]}`}
    >
      {kind}
    </span>
  );
}

export default function DeviceSelector({
  classifiedDevices,
  selectedDeviceId,
  onChange,
  connectionBadge = null,
}: DeviceSelectorProps) {
  // The WiFi sentinel is always appended by useDeviceDetection. When the only
  // real entry is a single non-wifi device, hide the dropdown and just show a
  // static label + badge.
  const realDevices = classifiedDevices.filter((d) => d.tipo !== 'wifi');
  const onlyOneRealOption =
    realDevices.length === 1 && classifiedDevices.length === 1;

  if (onlyOneRealOption) {
    const d = realDevices[0];
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 glass rounded-xl">
        <div className="flex items-center gap-2 text-slate-200">
          <span className="text-xl">{d.icon}</span>
          <span className="text-sm">{d.displayLabel}</span>
        </div>
        <Badge kind={connectionBadge} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <select
          value={selectedDeviceId ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-slate-900/70 border border-amber-400/30 rounded-xl px-4 py-3 pr-10 text-slate-100 text-sm focus:outline-none focus:border-amber-300/70"
        >
          <option value="" disabled>
            Selecione uma câmera...
          </option>
          {classifiedDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.icon}  {d.displayLabel}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-amber-300">
          ▾
        </span>
      </div>
      <Badge kind={connectionBadge} />
    </div>
  );
}
