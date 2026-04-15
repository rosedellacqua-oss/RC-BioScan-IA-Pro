import { useMemo } from 'react';

export type CameraKind =
  | 'usb_microscope'
  | 'mobile_back'
  | 'mobile_front'
  | 'webcam'
  | 'wifi';

export interface ClassifiedDevice {
  deviceId: string;
  label: string;
  displayLabel: string;
  tipo: CameraKind;
  icon: string;
}

export interface UseDeviceDetectionResult {
  isMobile: boolean;
  classifiedDevices: ClassifiedDevice[];
}

// Regex patterns used to classify a device from its label.
const BACK_PATTERNS = /(back|traseira|environment|rear)/i;
const FRONT_PATTERNS = /(front|frontal|user)/i;
const EXTERNAL_PATTERNS = /(microscop|max[\s-]?view|uvc|usb\s*video)/i;

// Display order. Lower number = higher in the list.
const PRIORITY: Record<CameraKind, number> = {
  usb_microscope: 1,
  mobile_back: 2,
  webcam: 3,
  mobile_front: 4,
  wifi: 5,
};

// Sentinel entry always appended at the end of the list so the UI can offer a
// manual WiFi/IP connection option.
const WIFI_ENTRY: ClassifiedDevice = {
  deviceId: 'wifi',
  label: 'Dispositivo WiFi (IP)',
  displayLabel: 'Dispositivo WiFi (IP)',
  tipo: 'wifi',
  icon: '📡',
};

function classify(
  rawLabel: string
): { tipo: CameraKind; icon: string; displayLabel: string } {
  const label = rawLabel || '';

  if (EXTERNAL_PATTERNS.test(label)) {
    return {
      tipo: 'usb_microscope',
      icon: '🔬',
      displayLabel: label || 'Microscópio USB',
    };
  }

  if (BACK_PATTERNS.test(label)) {
    return {
      tipo: 'mobile_back',
      icon: '📱',
      displayLabel: 'Câmera Traseira',
    };
  }

  if (FRONT_PATTERNS.test(label)) {
    return {
      tipo: 'mobile_front',
      icon: '📱',
      displayLabel: 'Câmera Frontal',
    };
  }

  return {
    tipo: 'webcam',
    icon: '💻',
    displayLabel: label || 'Webcam',
  };
}

function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Classifies a raw list of MediaDeviceInfo (videoinput) into a sorted, display-
 * ready list and exposes whether the current environment is mobile.
 *
 * The WiFi entry is always appended at the end of `classifiedDevices`.
 */
export function useDeviceDetection(
  rawDevices: MediaDeviceInfo[]
): UseDeviceDetectionResult {
  const isMobile = useMemo(() => detectMobile(), []);

  const classifiedDevices = useMemo<ClassifiedDevice[]>(() => {
    const videoInputs = (rawDevices || []).filter(
      (d) => d.kind === 'videoinput'
    );

    const classified = videoInputs.map<ClassifiedDevice>((d) => {
      const { tipo, icon, displayLabel } = classify(d.label);
      return {
        deviceId: d.deviceId,
        label: d.label || '',
        displayLabel,
        tipo,
        icon,
      };
    });

    classified.sort((a, b) => PRIORITY[a.tipo] - PRIORITY[b.tipo]);

    return [...classified, WIFI_ENTRY];
  }, [rawDevices]);

  return { isMobile, classifiedDevices };
}
