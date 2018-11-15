import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MeasureReportPage } from './measure-report/measure-report-page';
import { MeasureScanPage } from './measure-scan/measure-scan.page';
import { MeasureSeriesReportPage } from './measure-series-report/measure-series-report-page';
import { MeasureSeriesPage } from './measure-series/measure-series-page';
import { MeasureStepsPage } from './measure-steps/measure-steps.page';

const routes: Routes = [
  {
    path: 'scan',
    component: MeasureScanPage
  },
  {
    path: 'series',
    component: MeasureSeriesPage
  },
  {
    path: 'report',
    component: MeasureReportPage
  },
  {
    path: 'report-series',
    component: MeasureSeriesReportPage
  },
  {
    path: 'steps',
    component: MeasureStepsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MeasureRoutingModule {}
