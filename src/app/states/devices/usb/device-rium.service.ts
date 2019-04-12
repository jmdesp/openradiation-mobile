import { Injectable } from '@angular/core';
import { Actions, Store } from '@ngxs/store';
import { UsbSerial } from 'cordova-plugin-usb-serial';
import { Observable, Observer, of } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Step } from '../../measures/measure';
import { AbstractUSBDeviceService } from './abstract-usb-device.service';
import { DeviceRium } from './device-rium';

/**
 * Constant from cordova-plugin-usb-serial
 */
declare const UsbSerial: UsbSerial;

@Injectable({
  providedIn: 'root'
})
export class DeviceRiumService extends AbstractUSBDeviceService<DeviceRium> {
  constructor(protected store: Store, protected actions$: Actions) {
    super(store, actions$);
  }

  protected convertHitsNumberPerSec(hitsNumberPerSec: number): number {
    // TODO fix conversion factor
    return (hitsNumberPerSec * 60) / 500;
  }

  getDeviceInfo(device: DeviceRium): Observable<Partial<DeviceRium>> {
    return of({});
  }

  saveDeviceParams(device: DeviceRium): Observable<any> {
    return of(null);
  }

  startMeasureScan(device: DeviceRium, stopSignal: Observable<any>): Observable<Step> {
    return Observable.create((observer: Observer<ArrayBuffer>) => {
      UsbSerial.onDataReceived(data => observer.next(data), err => observer.error(err));
    }).pipe(
      takeUntil(stopSignal),
      map((buffer: ArrayBuffer) => this.decodeDataPackage(buffer)),
      filter((step: Step | null): step is Step => step !== null)
    );
  }

  protected decodeDataPackage(buffer: ArrayBuffer): Step | null {
    if (buffer.byteLength === 12) {
      const dataView = new DataView(buffer);
      const hitsNumber = dataView.getInt16(6);
      const temperature = dataView.getInt16(10) / 10;
      return {
        ts: Date.now(),
        hitsNumber,
        temperature
      };
    }
    return null;
  }

  buildDevice(): DeviceRium {
    return new DeviceRium();
  }
}
