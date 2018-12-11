import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { _ } from '@biesbjerg/ngx-translate-extract/dist/utils/utils';
import { Platform } from '@ionic/angular';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AutoUnsubscribePage } from '../../../components/auto-unsubscribe/auto-unsubscribe.page';
import { SelectIconOption } from '../../../components/select-icon/select-icon-option';
import { NavigationService } from '../../../services/navigation.service';
import {
  MeasureEnvironment,
  MeasureSeries,
  MeasureSeriesParamsSelected,
  PositionAccuracyThreshold
} from '../../../states/measures/measure';
import {
  AddRecentTag,
  CancelMeasure,
  StartMeasureSeriesReport,
  StopMeasureSeries,
  StopMeasureSeriesReport
} from '../../../states/measures/measures.action';
import { MeasuresState, MeasuresStateModel } from '../../../states/measures/measures.state';
import { UserState } from '../../../states/user/user.state';

@Component({
  selector: 'app-measure-series-report',
  templateUrl: './measure-series-report.page.html',
  styleUrls: ['./measure-series-report.page.scss']
})
export class MeasureSeriesReportPage extends AutoUnsubscribePage {
  @Select(UserState.login)
  login$: Observable<string | undefined>;

  @Select(MeasuresState.recentTags)
  recentTags$: Observable<string>;

  currentSeries?: MeasureSeries;
  measureSeriesReportForm?: FormGroup;
  reportScan = true;
  positionChangeSpeedOverLimit = false;

  measureSeriesParamsSelected = MeasureSeriesParamsSelected;

  url = '/measure/report-series';

  measurementEnvironmentOptions: SelectIconOption[];

  measurementHeightOptions: SelectIconOption[] = [
    {
      iconOn: 'assets/img/icon-floor-on.png',
      iconOff: 'assets/img/icon-floor-off.png',
      label: <string>_('MEASURES.SENSOR_POSITION.FLOOR'),
      value: 0
    },
    {
      iconOn: 'assets/img/icon-elevated-on.png',
      iconOff: 'assets/img/icon-elevated-off.png',
      label: <string>_('MEASURES.SENSOR_POSITION.1_METER_HIGH'),
      value: 1
    }
  ];

  rainOptions: SelectIconOption[] = [
    {
      iconOn: 'assets/img/icon-sun-on.png',
      iconOff: 'assets/img/icon-sun-off.png',
      label: <string>_('MEASURES.WEATHER.NO_RAIN'),
      value: false
    },
    {
      iconOn: 'assets/img/icon-rain-on.png',
      iconOff: 'assets/img/icon-rain-off.png',
      label: <string>_('MEASURES.WEATHER.RAIN'),
      value: true
    }
  ];

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected router: Router,
    private formBuilder: FormBuilder,
    private store: Store,
    private navigationService: NavigationService,
    private actions$: Actions,
    private platform: Platform
  ) {
    super(router);
  }

  pageEnter() {
    super.pageEnter();
    this.store.dispatch(new StartMeasureSeriesReport()).subscribe(() => {
      const { measureSeriesReport, currentSeries } = this.store.selectSnapshot(
        ({ measures }: { measures: MeasuresStateModel }) => measures
      );
      this.currentSeries = currentSeries;
      this.initMeasurementEnvironmentOptions(currentSeries!);
      if (measureSeriesReport) {
        this.measureSeriesReportForm = this.formBuilder.group({
          ...measureSeriesReport.model,
          tags: [measureSeriesReport.model.tags]
        });
        if (this.currentSeries!.sent) {
          this.measureSeriesReportForm.get('measurementEnvironment')!.disable();
          this.measureSeriesReportForm.get('measurementHeight')!.disable();
          this.measureSeriesReportForm.get('rain')!.disable();
          this.measureSeriesReportForm.get('description')!.disable();
          this.measureSeriesReportForm.get('tags')!.disable();
        }
      }
      this.init();
    });
  }

  init() {
    this.subscriptions.push(
      this.actions$.pipe(ofActionSuccessful(StopMeasureSeries, CancelMeasure)).subscribe(() => {
        this.activatedRoute.queryParams.pipe(take(1)).subscribe(queryParams => {
          this.measureSeriesReportForm = undefined;
          if (queryParams.goBackHistory) {
            this.navigationService.goBack();
          } else {
            this.navigationService.navigateRoot([
              'tabs',
              {
                outlets: {
                  home: 'home',
                  history: null,
                  settings: null,
                  map: null,
                  other: null
                }
              }
            ]);
          }
        });
      }),
      // TODO remove forced type once it's fixed https://github.com/ionic-team/ionic/issues/16535
      <Subscription>(<unknown>this.platform.backButton.subscribeWithPriority(9999, () => {
        this.cancelSeries();
      }))
    );
  }

  canPublish(measureSeries: MeasureSeries): boolean {
    return measureSeries.measures.some(
      item =>
        item.accuracy !== undefined &&
        item.accuracy !== null &&
        item.accuracy! < PositionAccuracyThreshold.No &&
        item.endAccuracy !== undefined &&
        item.endAccuracy !== null &&
        item.endAccuracy! < PositionAccuracyThreshold.No
    );
  }

  stopReport() {
    this.subscriptions.push(
      this.actions$.pipe(ofActionSuccessful(StopMeasureSeriesReport)).subscribe(() => {
        this.store.dispatch(new StopMeasureSeries());
      })
    );
    this.store.dispatch(new StopMeasureSeriesReport());
  }

  cancelSeries() {
    this.store.dispatch(new CancelMeasure());
  }

  tagAdded(tag: string) {
    this.store.dispatch(new AddRecentTag(tag));
  }

  initMeasurementEnvironmentOptions(measureSeries: MeasureSeries): any {
    measureSeries.measures.forEach(item => {
      const lat = item!.latitude;
      const long = item!.longitude;
      const endLat = item!.endLatitude;
      const endLong = item!.endLongitude;
      const duration = (item!.endTime! + 5000 - item!.startTime) / 60000;
      if (lat !== undefined && long !== undefined && endLat !== undefined && endLong !== undefined && duration > 0) {
        this.positionChangeSpeedOverLimit = MeasureSeriesReportPage.checkPositionChangeSpeed(
          lat,
          long,
          endLat,
          endLong,
          duration
        );
      }
    });
    this.measurementEnvironmentOptions = [
      {
        iconOn: 'assets/img/icon-countryside-on.png',
        iconOff: 'assets/img/icon-countryside-off.png',
        label: <string>_('MEASURES.ENVIRONMENT.COUNTRYSIDE'),
        value: MeasureEnvironment.Countryside,
        disabled: this.positionChangeSpeedOverLimit
      },
      {
        iconOn: 'assets/img/icon-city-on.png',
        iconOff: 'assets/img/icon-city-off.png',
        label: <string>_('MEASURES.ENVIRONMENT.CITY'),
        value: MeasureEnvironment.City,
        disabled: this.positionChangeSpeedOverLimit
      },
      {
        iconOn: 'assets/img/icon-inside-on.png',
        iconOff: 'assets/img/icon-inside-off.png',
        label: <string>_('MEASURES.ENVIRONMENT.INSIDE'),
        value: MeasureEnvironment.Inside,
        disabled: this.positionChangeSpeedOverLimit
      },
      {
        iconOn: 'assets/img/icon-ontheroad-on.png',
        iconOff: 'assets/img/icon-ontheroad-off.png',
        label: <string>_('MEASURES.ENVIRONMENT.ON_THE_ROAD'),
        value: MeasureEnvironment.OnTheRoad
      },
      {
        iconOn: 'assets/img/icon-plane-on.png',
        iconOff: 'assets/img/icon-plane-off.png',
        label: <string>_('MEASURES.ENVIRONMENT.PLANE'),
        value: MeasureEnvironment.Plane
      }
    ];
  }

  static checkPositionChangeSpeed(lat: number, long: number, endLat: number, endLong: number, duration: number) {
    let speed;
    const distance = MeasureSeriesReportPage.getDistance(lat, long, endLat, endLong);
    if (distance > 0) {
      speed = (distance * 60) / duration;
    } else {
      return false;
    }
    return speed > 25;
  }

  static getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const earth_radius = 6378137;
    const rlo1 = (Math.PI * lng1) / 180;
    const rla1 = (Math.PI * lat1) / 180;
    const rlo2 = (Math.PI * lng2) / 180;
    const rla2 = (Math.PI * lat2) / 180;
    const dlo = (rlo2 - rlo1) / 2;
    const dla = (rla2 - rla1) / 2;
    const a = Math.sin(dla) * Math.sin(dla) + Math.cos(rla1) * Math.cos(rla2) * (Math.sin(dlo) * Math.sin(dlo));
    const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (earth_radius * d) / 1000;
  }
}
