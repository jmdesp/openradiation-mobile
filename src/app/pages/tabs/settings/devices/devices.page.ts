import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Actions, ofActionDispatched, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AutoUnsubscribePage } from '../../../../components/auto-unsubscribe/auto-unsubscribe.page';
import { AbstractDevice } from '../../../../states/devices/abstract-device';
import {
  ConnectDevice,
  DeviceConnectionLost,
  DisconnectDevice,
  EditDeviceParams,
  StartDiscoverDevices,
  StopDiscoverDevices,
  UpdateDeviceInfo
} from '../../../../states/devices/devices.action';
import { DevicesState } from '../../../../states/devices/devices.state';

@Component({
  selector: 'app-page-devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss']
})
export class DevicesPage extends AutoUnsubscribePage {
  @Select(DevicesState.availableDevices)
  availableDevices$: Observable<AbstractDevice[]>;
  @Select(DevicesState.knownDevices)
  knownDevices$: Observable<AbstractDevice[]>;
  @Select(DevicesState.isScanning)
  isScanning$: Observable<boolean>;
  @Select(DevicesState.connectedDevice)
  connectedDevice$: Observable<AbstractDevice>;

  connectingDevice: AbstractDevice | undefined;

  url = '/tabs/(settings:devices)';

  constructor(
    protected router: Router,
    private store: Store,
    private actions$: Actions,
    private navController: NavController
  ) {
    super(router);
  }

  pageEnter() {
    super.pageEnter();
    this.subscriptions.push(
      this.actions$
        .pipe(ofActionDispatched(ConnectDevice))
        .subscribe(({ device }: ConnectDevice) => (this.connectingDevice = device)),
      this.actions$
        .pipe(ofActionSuccessful(ConnectDevice, DeviceConnectionLost))
        .subscribe(() => (this.connectingDevice = undefined))
    );
    this.store.dispatch(new StartDiscoverDevices()).subscribe();
  }

  pageLeave() {
    super.pageLeave();
    this.store.dispatch(new StopDiscoverDevices()).subscribe();
  }

  connectDevice(device: AbstractDevice) {
    this.store.dispatch(new ConnectDevice(device)).subscribe(() => this.store.dispatch(new UpdateDeviceInfo(device)));
  }

  disconnectDevice() {
    this.store.dispatch(new DisconnectDevice()).subscribe();
  }

  editDeviceParams(event: Event, device: AbstractDevice) {
    event.stopPropagation();
    this.store.dispatch(new EditDeviceParams(device)).subscribe(() =>
      this.navController.navigateForward([
        'tabs',
        {
          outlets: {
            settings: 'device-param'
          }
        }
      ])
    );
  }

  goBack() {
    this.navController.goBack();
  }
}
