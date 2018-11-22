import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { StorageEngine } from '@ngxs/storage-plugin';
import { from, Observable } from 'rxjs';

@Injectable()
export class StorageService implements StorageEngine {
  constructor(private storage: Storage) {}

  getItem(key: any): Observable<any> {
    return from(this.storage.get(key));
  }

  setItem(key: any, val: any): void {
    this.storage.set(key, val);
  }
}
