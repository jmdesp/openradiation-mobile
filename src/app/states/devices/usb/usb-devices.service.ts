import { Injectable } from '@angular/core';
import { Serial } from '@ionic-native/serial/ngx';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Actions, ofActionDispatched, Store } from '@ngxs/store';
import { forkJoin, interval, Observable, of } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { concatMap, takeUntil, takeWhile } from 'rxjs/operators';
import { AlertService } from '../../../services/alert.service';
import { StartDiscoverUSBDevices, StopDiscoverDevices, USBDevicesDiscovered } from '../devices.action';
import { AbstractUSBDevice } from './abstract-usb-device';
import { DevicePocketGeiger } from './device-pocket-geiger';

@Injectable({
  providedIn: 'root'
})
export class USBDevicesService {
  private currentAlert?: any;

  constructor(
    private serial: Serial,
    private store: Store,
    private translateService: TranslateService,
    private alertService: AlertService,
    private platform: Platform,
    private actions$: Actions
  ) {
    this.actions$.pipe(ofActionDispatched(StartDiscoverUSBDevices)).subscribe(() => {
      if (this.currentAlert) {
        this.currentAlert.dismiss();
        this.currentAlert = undefined;
      }
    });
  }

  startDiscoverDevices(): Observable<any> {
    this.discoverDevices();
    return of(null);
  }

  private discoverDevices() {
    const usbDevices: AbstractUSBDevice[] = [new DevicePocketGeiger()];
    interval(1000)
      .pipe(
        takeUntil(this.actions$.pipe(ofActionDispatched(StopDiscoverDevices, StartDiscoverUSBDevices))),
        takeWhile(() => this.currentAlert === undefined),
        concatMap(() =>
          forkJoin(
            usbDevices.map(device =>
              fromPromise(
                this.serial
                  .requestPermission({ vid: device.vid, pid: device.pid, driver: device.driver })
                  .then(() => [device])
                  .catch(err => {
                    if (err === 'Permission to connect to the device was denied!') {
                      this.onUSBError();
                    }
                    return [];
                  })
              )
            )
          )
        )
      )
      .subscribe(devices =>
        this.store.dispatch(new USBDevicesDiscovered((<AbstractUSBDevice[]>[]).concat(...devices)))
      );
  }

  private onUSBError() {
    this.alertService
      .show(
        {
          header: this.translateService.instant('USB.USB_PERMISSION.TITLE'),
          message: this.translateService.instant('USB.USB_PERMISSION.NOTICE'),
          backdropDismiss: false,
          buttons: [
            {
              text: this.translateService.instant('GENERAL.OK'),
              handler: () => {
                this.store.dispatch(new StartDiscoverUSBDevices());
                return true;
              }
            }
          ]
        },
        false
      )
      .then(alert => (this.currentAlert = alert));
  }
}