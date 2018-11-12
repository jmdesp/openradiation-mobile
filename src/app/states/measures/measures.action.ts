import { Geoposition } from '@ionic-native/geolocation';
import { AbstractDevice } from '../devices/abstract-device';
import { Measure, Step } from './measure';

export class EnableExpertMode {
  static readonly type = '[Measures] Enable expert mode';
}

export class DisableExpertMode {
  static readonly type = '[Measure] Disable expert mode';
}

export class EnableAutoPublish {
  static readonly type = '[Measures] Enable auto publish';
}

export class DisableAutoPublish {
  static readonly type = '[Measures] Disable auto publish';
}

export class StartWatchPosition {
  static readonly type = '[Measures] Start watch position';
}

export class StopWatchPosition {
  static readonly type = '[Measures] Stop watch position';
}

export class PositionChanged {
  static readonly type = '[Measures] Position changed';
  constructor(public position?: Geoposition) {}
}

export class StartMeasure {
  static readonly type = '[Measures] Start measure';
  constructor(public device: AbstractDevice) {}
}

export class StopMeasure {
  static readonly type = '[Mesures] Stop measure';
}

export class StartMeasureSeriesParams {
  static readonly type = '[Measures] Start measure series params';
}

export class StopMeasureSeriesParams {
  static readonly type = '[Measures] Stop measure series params';
}

export class CancelMeasure {
  static readonly type = '[Measures] Cancel measure';
}

export class AddMeasureScanStep {
  static readonly type = '[Measures] Add measure scan step';
  constructor(public step: Step, public device: AbstractDevice) {}
}

export class UpdateMeasureScanTime {
  static readonly type = '[Measures] Update measure scan time';
  constructor(public device: AbstractDevice) {}
}

export class StartMeasureScan {
  static readonly type = '[Measures] Start measure radiation scan';
  constructor(public device: AbstractDevice) {}
}

export class StopMeasureScan {
  static readonly type = '[Measures] Stop measure radiation scan';
}

export class StartNextMeasureSeries {
  static readonly type = '[Measures] Start next measure series scan';
}

export class StartMeasureReport {
  static readonly type = '[Measures] Start measure report';
}

export class StartMeasureSeriesReport {
  static readonly type = '[Measures] Start measure series report';
}

export class StopMeasureReport {
  static readonly type = '[Measures] Stop measure report';
}

export class StartManualMeasure {
  static readonly type = '[Measures] Start manual measure';
}

export class PublishMeasure {
  static readonly type = '[Measures] Publish measure';
  constructor(public measure: Measure) {}
}

export class DeleteMeasure {
  static readonly type = '[Measures] Delete measure';
  constructor(public measure: Measure) {}
}

export class DeleteAllMeasures {
  static readonly type = '[Measures] Delete all measures';
}

export class ShowMeasure {
  static readonly type = '[Measures] Show measure detail';
  constructor(public measure: Measure) {}
}
