import { AbstractDevice, RawDevice } from '../abstract-device';

export abstract class AbstractBLEDevice extends AbstractDevice {
  constructor(rawDevice: RawBLEDevice) {
    super();
    this.sensorUUID = rawDevice.id;
  }
}

export interface RawBLEDevice extends RawDevice {
  id: string;
  advertising: ArrayBuffer | { kCBAdvDataManufacturerData: ArrayBuffer };
  rssi: number;
  characteristics?: {
    characteristic: string;
    properties: string[];
    descriptors: any[];
    service: string;
  }[];
}
