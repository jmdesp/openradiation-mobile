import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Measure, Step } from '../measures/measure';
import { AbstractDevice, CalibrationFunctions, RawDevice } from './abstract-device';
import { DeviceRium } from './usb/device-rium';

export abstract class AbstractDeviceService<T extends AbstractDevice> {
  protected textDecoder = new TextDecoder('utf8');

  protected abstract calibrationFunctions: {
    planeMode: CalibrationFunctions;
    groundLevel: CalibrationFunctions;
  };

  constructor(protected store: Store) {}

  abstract buildDevice(rawDevice?: RawDevice): T | null;

  abstract getDeviceInfo(device: T): Observable<Partial<T>>;

  abstract saveDeviceParams(device: T): Observable<any>;

  abstract startMeasureScan(device: T, stopSignal: Observable<any>): Observable<Step>;

  computeRadiationValue(measure: Measure, planeMode: boolean): [number, string] {
    if (measure.endTime && measure.hitsNumber !== undefined) {
      const duration = (measure.endTime - measure.startTime) / 1000;
      const hitsNumberPerSec = measure.hitsNumber / duration;
      return this.convertHitsNumberPerSec(hitsNumberPerSec, planeMode);
    } else {
      throw new Error('Incorrect measure : missing endTime or hitsNumber');
    }
  }

  protected convertHitsNumberPerSec(hitsNumberPerSec: number, planeMode: boolean): [number, string] {
    const calibrationFunction = this.getCalibrationFunction(
      hitsNumberPerSec,
      planeMode ? this.calibrationFunctions.planeMode : this.calibrationFunctions.groundLevel
    );
    if (calibrationFunction) {
      // tslint:disable-next-line:no-eval
      return [eval(calibrationFunction), calibrationFunction];
    } else {
      return [0, ''];
    }
  }

  protected getCalibrationFunction(hitsNumberPerSec: number, calibrationFunctions: CalibrationFunctions): string {
    const thresholds = Object.keys(calibrationFunctions)
      .sort()
      .reverse();
    let determinedCalibrationFunctions = 0;
    for (const threshold of thresholds) {
      if (hitsNumberPerSec >= parseInt(threshold, 10)) {
        determinedCalibrationFunctions = parseInt(threshold, 10);
        break;
      }
    }
    return calibrationFunctions[determinedCalibrationFunctions];
  }

  abstract connectDevice(device: T): Observable<any>;

  abstract disconnectDevice(device: T): Observable<any>;

  protected abstract decodeDataPackage(buffer: ArrayBuffer | ArrayBuffer[]): Step | null;
}
