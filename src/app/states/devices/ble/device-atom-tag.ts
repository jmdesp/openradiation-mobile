import { _ } from '@biesbjerg/ngx-translate-extract/dist/utils/utils';
import { ApparatusSensorType, DeviceType } from '../abstract-device';
import { DeviceParams, DeviceParamsModel, DeviceParamType } from '../device-params';
import { AbstractBLEDevice, RawBLEDevice } from './abstract-ble-device';

export class DeviceAtomTag extends AbstractBLEDevice {
  readonly deviceType = DeviceType.AtomTag;
  apparatusVersion: string = DeviceType.AtomTag;
  apparatusSensorType = ApparatusSensorType.Geiger;
  apparatusTubeType = 'SBM-20';
  hitsPeriod = 2000;

  params: DeviceParams = {
    audioHits: true,
    vibrationHits: true
  };
  paramsModel: DeviceParamsModel = {
    audioHits: {
      label: <string>_('SENSORS.PARAM.AUDIO_HITS'),
      type: DeviceParamType.Boolean
    },
    vibrationHits: {
      label: <string>_('SENSORS.PARAM.VIBRATION_HITS'),
      type: DeviceParamType.Boolean
    }
  };

  constructor(rawDevice: RawBLEDevice) {
    super(rawDevice);
    if (rawDevice.advertising instanceof ArrayBuffer) {
      const data = new Uint8Array(rawDevice.advertising);
      this.batteryLevel = data[28];
    } else {
      const data = new Uint8Array(rawDevice.advertising.kCBAdvDataManufacturerData);
      this.batteryLevel = data[1];
    }
    this.apparatusId = rawDevice.id;
  }
}
