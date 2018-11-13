import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { _ } from '@biesbjerg/ngx-translate-extract/dist/utils/utils';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AutoUnsubscribePage } from '../../../components/auto-unsubscribe/auto-unsubscribe.page';
import { SelectIconOption } from '../../../components/select-icon/select-icon-option';
import { MeasureEnvironment, MeasureSeries, PositionAccuracyThreshold } from '../../../states/measures/measure';
import { StartMeasureSeriesReport } from '../../../states/measures/measures.action';
import { MeasuresStateModel } from '../../../states/measures/measures.state';
import { UserState } from '../../../states/user/user.state';

@Component({
  selector: 'app-measure-report-series',
  templateUrl: './measure-report-series.page.html',
  styleUrls: ['./measure-report-series.page.scss']
})
export class MeasureReportSeriesPage extends AutoUnsubscribePage {
  @Select(UserState.login)
  login$: Observable<string | undefined>;

  currentSeries?: MeasureSeries;
  measureReportSeriesForm?: FormGroup;
  reportScan = true;
  positionChangeSpeedOverLimit = false;

  positionAccuracyThreshold = PositionAccuracyThreshold;

  url = '/measure/report-series';

  measurementEnvironmentOptions: SelectIconOption[] = [
    {
      iconOn: 'assets/img/icon-countryside-on.png',
      iconOff: 'assets/img/icon-countryside-off.png',
      label: <string>_('MEASURES.ENVIRONMENT.COUNTRYSIDE'),
      value: MeasureEnvironment.Countryside
    },
    {
      iconOn: 'assets/img/icon-city-on.png',
      iconOff: 'assets/img/icon-city-off.png',
      label: <string>_('MEASURES.ENVIRONMENT.CITY'),
      value: MeasureEnvironment.City
    },
    {
      iconOn: 'assets/img/icon-inside-on.png',
      iconOff: 'assets/img/icon-inside-off.png',
      label: <string>_('MEASURES.ENVIRONMENT.INSIDE'),
      value: MeasureEnvironment.Inside
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

  constructor(protected router: Router, private store: Store, private formBuilder: FormBuilder) {
    super(router);
  }

  pageEnter() {
    super.pageEnter();
    this.store.dispatch(new StartMeasureSeriesReport()).subscribe(() => {
      const { measureSeriesReport, currentSeries } = this.store.selectSnapshot(
        ({ measures }: { measures: MeasuresStateModel }) => measures
      );
      this.currentSeries = currentSeries;
      if (measureSeriesReport) {
        this.measureReportSeriesForm = this.formBuilder.group({
          ...measureSeriesReport.model,
          tags: [measureSeriesReport.model.tags]
        });
      }
    });
  }

  stopReport() {}

  cancelSeries() {}
}
