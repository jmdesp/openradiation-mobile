import { Injectable } from '@angular/core';
import { BLE } from '@ionic-native/ble/ngx';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { filter, map } from 'rxjs/operators';
import { Measure, Step } from '../../measures/measure';
import { DeviceType } from '../abstract-device';
import { AbstractBLEDeviceService } from './abstract-ble-device.service';
import { DeviceAtomTag } from './device-atom-tag';

@Injectable({
  providedIn: 'root'
})
export class DeviceAtomTagService extends AbstractBLEDeviceService<DeviceAtomTag> {
  private firmwareService = '180a';
  private firmwareCharacteristic = '2a26';
  private service = '63462A4A-C28C-4FFD-87A4-2D23A1C72581';
  private settingsCharacteristic = 'ea50cfcd-ac4a-4a48-bf0e-879e548ae157';
  private receiveCharacteristic = '70BC767E-7A1A-4304-81ED-14B9AF54F7BD';

  constructor(protected store: Store, protected ble: BLE) {
    super(store, ble);
  }

  computeRadiationValue(measure: Measure): number {
    if (measure.endTime) {
      const duration = (measure.endTime - measure.startTime) / 1000;
      const TcNet = measure.hitsNumber / duration;
      return (TcNet * 0.128 * 3600 - 40) / 1000;
    } else {
      throw new Error('Incorrect measure : missing endTime');
    }
  }

  getDeviceInfo(device: DeviceAtomTag): Observable<Partial<DeviceAtomTag>> {
    return fromPromise(this.ble.read(device.sensorUUID, this.firmwareService, this.firmwareCharacteristic)).pipe(
      map(buffer => {
        const firmwareVersion = this.textDecoder.decode(new Uint8Array(buffer));
        return {
          apparatusVersion: `${DeviceType.AtomTag} ${firmwareVersion.replace(/\0/g, '')}`
        };
      })
    );
  }

  saveDeviceParams(device: DeviceAtomTag): Observable<any> {
    let command: Promise<any>;
    if (device.params.audioHits && device.params.vibrationHits) {
      command = this.sendSettingsCommand(device, 0x10).then(() => this.sendSettingsCommand(device, 0x06));
    } else if (device.params.audioHits) {
      command = this.sendSettingsCommand(device, 0x10).then(() => this.sendSettingsCommand(device, 0x04));
    } else if (device.params.vibrationHits) {
      // TODO fix vibration only mode
      command = this.sendSettingsCommand(device, 0x10).then(() => this.sendSettingsCommand(device, 0x13, 0x0011));
    } else {
      command = this.sendSettingsCommand(device, 0x0a);
    }
    return fromPromise(command);
  }

  private sendSettingsCommand(device: DeviceAtomTag, command: number, param?: number): Promise<any> {
    const dataView = new DataView(new ArrayBuffer(3));
    dataView.setUint8(0, command);
    if (param !== undefined) {
      dataView.setUint16(1, param);
    }
    return this.ble.write(device.sensorUUID, this.service, this.settingsCharacteristic, dataView.buffer);
  }

  startMeasureScan(device: DeviceAtomTag, stopSignal: Observable<any>): Observable<Step> {
    stopSignal.subscribe(() => this.stopReceiveData(device));
    return this.startReceiveData(device).pipe(
      map((buffer: ArrayBuffer) => this.decodeDataPackage(buffer)),
      filter((step: Step | null): step is Step => step !== null)
    );
  }

  private startReceiveData(device: DeviceAtomTag): Observable<any> {
    return this.ble.startNotification(device.sensorUUID, this.service, this.receiveCharacteristic);
  }

  private stopReceiveData(device: DeviceAtomTag) {
    return this.ble.stopNotification(device.sensorUUID, this.service, this.receiveCharacteristic);
  }

  protected decodeDataPackage(buffer: ArrayBuffer): Step | null {
    const dataView = new DataView(buffer);
    return {
      ts: Date.now(),
      hitsNumber: dataView.getUint16(9, true),
      temperature: dataView.getUint8(12)
    };
  }
}
