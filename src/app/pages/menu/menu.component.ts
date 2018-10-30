import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController, MenuController, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { StartManualMeasure, StartSeriesMeasure, StopWatchPosition } from '../../states/measures/measures.action';
import { UserState } from '../../states/user/user.state';
import { RedirectAfterLogin } from '../tabs/settings/log-in/log-in.page';
import { DevicesState } from '../../states/devices/devices.state';
import { AbstractDevice } from '../../states/devices/abstract-device';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
  @Select(UserState.login)
  login$: Observable<string | undefined>;

  @Select(DevicesState.connectedDevice)
  connectedDevice$: Observable<AbstractDevice | undefined>;

  canStartMeasure: Observable<boolean>;
  currentUrl: string;

  constructor(
    private menuController: MenuController,
    private router: Router,
    private navController: NavController,
    private store: Store,
    private actions$: Actions,
    private alertController: AlertController,
    private translateService: TranslateService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => (this.currentUrl = event.url));
    this.actions$
      .pipe(ofActionSuccessful(StartManualMeasure))
      .subscribe(() => this.navController.navigateRoot(['measure', 'report'], true));
    this.actions$
      .pipe(ofActionSuccessful(StartSeriesMeasure))
      .subscribe(() => this.navController.navigateRoot(['measure', 'series'], true));
    this.canStartMeasure = this.connectedDevice$.pipe(map(connectedDevice => connectedDevice !== undefined));
  }

  closeMenu() {
    this.menuController.close();
  }

  startSeriesMeasure() {
    this.closeMenu();
    this.login$.pipe(take(1)).subscribe(login => {
      if (login !== undefined) {
        this.connectedDevice$.pipe(take(1)).subscribe(connectedDevice => {
          if (connectedDevice) {
            this.store.dispatch(new StartSeriesMeasure());
          }
        });
      } else {
        this.goToLogin(RedirectAfterLogin.StartSeriesMeasure);
      }
    });
  }

  startManualMeasure() {
    this.closeMenu();
    this.login$.pipe(take(1)).subscribe(login => {
      if (login !== undefined) {
        this.store.dispatch(new StartManualMeasure());
      } else {
        this.goToLogin(RedirectAfterLogin.StartMeasure);
      }
    });
  }

  private goToLogin(redirectAfterLogin: RedirectAfterLogin) {
    this.alertController
      .create({
        header: this.translateService.instant('MEASURE_MANUAL.TITLE'),
        message: this.translateService.instant('MEASURE_MANUAL.ALERT'),
        backdropDismiss: false,
        buttons: [
          {
            text: this.translateService.instant('GENERAL.CANCEL')
          },
          {
            text: this.translateService.instant('LOG_IN.TITLE'),
            handler: () =>
              this.navController.navigateForward(
                [
                  'tabs',
                  {
                    outlets: {
                      settings: 'log-in',
                      home: null,
                      history: null,
                      map: null,
                      other: null
                    }
                  }
                ],
                true,
                { queryParams: { redirectAfterLogin: redirectAfterLogin } }
              )
          }
        ]
      })
      .then(alert => alert.present());
  }
}
