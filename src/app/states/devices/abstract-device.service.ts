import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Measure, Step } from '../measures/measure';
import { AbstractDevice } from './abstract-device';

export abstract class AbstractDeviceService<T extends AbstractDevice> {
  protected textDecoder = new TextDecoder('utf8');

  constructor(protected store: Store) {}

  abstract getDeviceInfo(device: T): Observable<Partial<T>>;

  abstract saveDeviceParams(device: T): Observable<any>;

  abstract startMeasureScan(device: T, stopSignal: Observable<any>): Observable<Step>;

  abstract computeRadiationValue(measure: Measure): number;

  abstract connectDevice(device: T): Observable<any>;

  abstract disconnectDevice(device: T): Observable<any>;

  protected abstract decodeDataPackage(buffer: ArrayBuffer | ArrayBuffer[]): Step | null;
}
