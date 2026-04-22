import { useMemo } from 'react';

export type DeviceKind =
  | 'usb_microscope'
  | 'wifi_microscope'
  | 'mobile_back'
  | 'mobile_front'
  | 'webcam'
  | 'unknown';

export interface ClassifiedDevice {
  deviceId: string;
  label: string;
  kind: DeviceKind;
  priority: number;
  icon: string;
}

const BACK_CAMERA_PATTERNS = [/back/i, /traseira/i, /environment/i, /rear/i];
const FRONT_CAMERA_PATTERNS = [/front/i, /frontal/i, /\buser\b/i, /selfie/i];
const EXTERNAL_CAMERA_PATTERNS = [
  /microscop/i,
  /max[\s-]?view/i,
  /\busb\b/i,
  /\buvc\b/i,
  /endoscop/i,
  /\botg\b/i,
  /\bexternal\b/i,
  /\bcamera\s*\d/i,
  /dino[\s-]?lite/i,
  /supereyes/i,
  /andonstar/i,
  /celestron/i,
  /plugable/i,
  /jiusion/i,
  /bysameyee/i,
  /video\s*capture/i,
  /capture\s*card/i,
];

function classifyDevice(
  label: string,
  deviceId: string,
  isMobile: boolean
): { kind: DeviceKind; priority: number; icon: string } {
  const normalized = label || '';

  if (EXTERNAL_CAMERA_PATTERNS.some((p) => p.test(normalized))) {
    return { kind: 'usb_microscope', priority: 1, icon: '🔬' };
  }

  if (isMobile) {
    if (BACK_CAMERA_PATTERNS.some((p) => p.test(normalized))) {
      return { kind: 'mobile_back', priority: 2, icon: '📱' };
    }
    if (FRONT_CAMERA_PATTERNS.some((p) => p.test(normalized))) {
      return { kind: 'mobile_front', priority: 4, icon: '🤳' };
    }
    // Unlabeled camera on mobile: assume it's a phone camera, default to back.
    return { kind: 'mobile_back', priority: 2, icon: '📱' };
  }

  // Desktop - no label patterns matched: generic webcam
  return { kind: 'webcam', priority: 3, icon: '💻' };
}

export function useDeviceDetection(
  devices: MediaDeviceInfo[],
  isMobile: boolean
): ClassifiedDevice[] {
  return useMemo(() => {
    const classified = devices
      .filter((d) => d.kind === 'videoinput')
      .map<ClassifiedDevice>((d) => {
        const { kind, priority, icon } = classifyDevice(
          d.label,
          d.deviceId,
          isMobile
        );
        return {
          deviceId: d.deviceId,
          label: d.label || 'Câmera sem rótulo',
          kind,
          priority,
          icon,
        };
      });

    // On mobile, if there are 3+ cameras and some are "mobile_back",
    // the extras are likely OTG/USB devices — reclassify them.
    if (isMobile) {
      const backCount = classified.filter(d => d.kind === 'mobile_back').length;
      if (backCount > 1) {
        let promoted = false;
        for (const d of classified) {
          if (d.kind === 'mobile_back' && !promoted) {
            promoted = true;
            continue;
          }
          if (d.kind === 'mobile_back') {
            d.kind = 'usb_microscope';
            d.priority = 1;
            d.icon = '🔬';
            d.label = d.label === 'Câmera sem rótulo'
              ? 'Dispositivo externo (OTG/USB)'
              : d.label;
          }
        }
      }
    }

    classified.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.label.localeCompare(b.label);
    });

    return classified;
  }, [devices, isMobile]);
}

export function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function hasMediaDevicesSupport(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.enumerateDevices === 'function' &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}
