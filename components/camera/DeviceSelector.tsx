import React from 'react';
import type { ClassifiedDevice, DeviceKind } from '../../hooks/useDeviceDetection';

export const WIFI_DEVICE_ID = '__wifi__';

export interface DeviceSelectorProps {
  devices: ClassifiedDevice[];
  activeDeviceId: string | null;
  onSelect: (deviceId: string) => void;
  includeWifiOption?: boolean;
}

const KIND_BADGE: Record<DeviceKind, { label: string; color: string }> = {
  usb_microscope: { label: 'USB', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  wifi_microscope: { label: 'WiFi', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  mobile_back: { label: 'Nativo', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  mobile_front: { label: 'Nativo', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  webcam: { label: 'USB', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  unknown: { label: '—', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
};

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  activeDeviceId,
  onSelect,
  includeWifiOption = true,
}) => {
  const totalOptions = devices.length + (includeWifiOption ? 1 : 0);

  // If there is exactly one option and no WiFi option, auto-select it silently.
  if (totalOptions === 1 && devices.length === 1 && activeDeviceId === devices[0].deviceId) {
    const d = devices[0];
    const badge = KIND_BADGE[d.kind];
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl">{d.icon}</span>
          <span className="text-sm font-medium truncate">{d.label}</span>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${badge.color}`}>
          {badge.label}
        </span>
      </div>
    );
  }

  const activeIsWifi = activeDeviceId === WIFI_DEVICE_ID;
  const activeDevice = devices.find((d) => d.deviceId === activeDeviceId);
  const activeBadge = activeIsWifi
    ? KIND_BADGE.wifi_microscope
    : activeDevice
      ? KIND_BADGE[activeDevice.kind]
      : null;

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
        Fonte de Captura
      </label>
      <div className="flex items-center gap-2">
        <select
          value={activeDeviceId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="flex-1 bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        >
          <option value="" disabled>
            Selecione uma fonte…
          </option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.icon} {d.label}
            </option>
          ))}
          {includeWifiOption && (
            <option value={WIFI_DEVICE_ID}>📡 Dispositivo WiFi (IP)</option>
          )}
        </select>
        {activeBadge && (
          <span
            className={`text-[10px] uppercase font-bold px-2 py-1 rounded border whitespace-nowrap ${activeBadge.color}`}
          >
            {activeBadge.label}
          </span>
        )}
      </div>
    </div>
  );
};
