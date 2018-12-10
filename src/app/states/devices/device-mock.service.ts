import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { interval, Observable, of } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Step } from '../measures/measure';
import { AbstractDeviceService } from './abstract-device.service';
import { DeviceMock } from './device-mock';

@Injectable({
  providedIn: 'root'
})
export class DeviceMockService extends AbstractDeviceService<DeviceMock> {
  constructor(protected store: Store) {
    super(store);
  }

  protected convertHitsNumberPerSec(hitsNumberPerSec: number): number {
    const TcNet = hitsNumberPerSec - 0.14;
    return 0.000001 * TcNet ** 3 + 0.0025 * TcNet ** 2 + 0.39 * TcNet;
  }

  getDeviceInfo(device: DeviceMock): Observable<Partial<DeviceMock>> {
    return of({});
  }

  saveDeviceParams(device: DeviceMock): Observable<any> {
    return of(null);
  }

  startMeasureScan(device: DeviceMock, stopSignal: Observable<any>): Observable<Step> {
    const mockSource = interval(1000).pipe(takeUntil(stopSignal));
    return mockSource.pipe(
      map(() => this.decodeDataPackage()),
      filter((step: Step | null): step is Step => step !== null)
    );
  }

  connectDevice(device: DeviceMock): Observable<any> {
    return of(null);
  }

  disconnectDevice(device: DeviceMock): Observable<any> {
    return of(null);
  }

  protected decodeDataPackage(): Step | null {
    return {
      hitsNumber: Math.round(Math.random() * 0.75),
      ts: Date.now(),
      temperature: 25 + (0.5 - Math.random()) * 2
    };
  }
}
