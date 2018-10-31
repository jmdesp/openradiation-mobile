import { Device } from '@ionic-native/device/ngx';
import { Geoposition } from '@ionic-native/geolocation';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DateService } from './date.service';
import {
  HitsAccuracyThreshold,
  Measure,
  MeasureReport,
  MeasureSeries,
  MeasureSeriesParams,
  PositionAccuracyThreshold
} from './measure';
import {
  AddMeasureScanStep,
  CancelMeasure,
  DeleteAllMeasures,
  DeleteMeasure,
  DisableAutoPublish,
  DisableExpertMode,
  EnableAutoPublish,
  EnableExpertMode,
  PositionChanged,
  PublishMeasure,
  ShowMeasure,
  StartManualMeasure,
  StartMeasure,
  StartMeasureReport,
  StartMeasureScan,
  StartMeasureSeriesParams,
  StartNextMeasureSeries,
  StartWatchPosition,
  StopMeasure,
  StopMeasureReport,
  StopMeasureScan,
  StopMeasureSeriesParams,
  StopWatchPosition,
  UpdateMeasureScanTime
} from './measures.action';
import { MeasuresService } from './measures.service';
import { PositionService } from './position.service';

export interface MeasuresStateModel {
  measures: Measure[];
  currentPosition?: Geoposition;
  isWatchingPosition: boolean;
  currentMeasure?: Measure;
  currentSeries?: MeasureSeries;
  measureReport?: {
    model: MeasureReport;
    dirty: boolean;
    status: string;
    errors: any;
  };
  measureSeriesParams?: {
    model: MeasureSeriesParams;
    dirty: boolean;
    status: string;
    errors: any;
  };
  params: {
    expertMode: boolean;
    autoPublish: boolean;
  };
}

@State<MeasuresStateModel>({
  name: 'measures',
  defaults: {
    measures: [],
    isWatchingPosition: false,
    params: {
      expertMode: false,
      autoPublish: false
    }
  }
})
export class MeasuresState {
  constructor(
    private positionService: PositionService,
    private device: Device,
    private measuresService: MeasuresService,
    private dateService: DateService
  ) {}

  @Selector()
  static expertMode(state: MeasuresStateModel): boolean {
    return state.params.expertMode;
  }

  @Selector()
  static autoPublish(state: MeasuresStateModel): boolean {
    return state.params.autoPublish;
  }

  @Selector()
  static currentPosition(state: MeasuresStateModel): Geoposition | undefined {
    return state.currentPosition;
  }

  @Selector()
  static positionAccuracy(state: MeasuresStateModel): number {
    return state.currentPosition ? state.currentPosition.coords.accuracy : PositionAccuracyThreshold.No;
  }

  @Selector()
  static isWatchingPosition(state: MeasuresStateModel): boolean {
    return state.isWatchingPosition;
  }

  @Selector()
  static currentMeasure(state: MeasuresStateModel): Measure | undefined {
    return state.currentMeasure;
  }

  @Selector()
  static measures(state: MeasuresStateModel): Measure[] {
    return state.measures;
  }

  @Action(EnableExpertMode)
  enableExpertMode({ getState, patchState }: StateContext<MeasuresStateModel>) {
    const { params } = getState();
    patchState({
      params: { ...params, expertMode: true }
    });
  }

  @Action(DisableExpertMode)
  disableExpertMode({ getState, patchState }: StateContext<MeasuresStateModel>) {
    const { params } = getState();
    patchState({
      params: { ...params, expertMode: false }
    });
  }

  @Action(EnableAutoPublish)
  enableAutoPublish({ getState, patchState }: StateContext<MeasuresStateModel>) {
    const { params } = getState();
    patchState({
      params: { ...params, autoPublish: true }
    });
  }

  @Action(DisableAutoPublish)
  disableAutoPublish({ getState, patchState }: StateContext<MeasuresStateModel>) {
    const { params } = getState();
    patchState({
      params: { ...params, autoPublish: false }
    });
  }

  @Action(StartWatchPosition)
  startWatchPosition({ patchState }: StateContext<MeasuresStateModel>) {
    return this.positionService.startWatchPosition().pipe(
      tap(position =>
        patchState({
          currentPosition: position,
          isWatchingPosition: true
        })
      )
    );
  }

  @Action(StopWatchPosition)
  stopDiscoverDevices({ patchState }: StateContext<MeasuresStateModel>) {
    patchState({
      isWatchingPosition: false
    });
  }

  @Action(PositionChanged)
  positionChanged({ patchState }: StateContext<MeasuresStateModel>, { position }: PositionChanged) {
    patchState({
      currentPosition: position
    });
  }

  @Action(StartMeasure)
  startMeasure({ patchState }: StateContext<MeasuresStateModel>, { device }: StartMeasure) {
    patchState({
      currentMeasure: new Measure(
        device.apparatusId,
        device.apparatusVersion,
        device.apparatusSensorType,
        device.apparatusTubeType,
        this.device.uuid,
        this.device.platform,
        this.device.version,
        this.device.model
      )
    });
  }

  @Action(StartManualMeasure)
  startManualMeasure({ getState, patchState }: StateContext<MeasuresStateModel>) {
    const { currentPosition } = getState();
    let currentMeasure = {
      ...new Measure(
        undefined,
        undefined,
        undefined,
        undefined,
        this.device.uuid,
        this.device.platform,
        this.device.version,
        this.device.model,
        true
      ),
      startTime: Date.now()
    };
    currentMeasure = Measure.updateStartPosition(currentMeasure, currentPosition);
    currentMeasure = Measure.updateEndPosition(currentMeasure, currentPosition);
    patchState({
      currentMeasure
    });
  }

  @Action(StopMeasure)
  stopMeasure({ getState, patchState, dispatch }: StateContext<MeasuresStateModel>) {
    const { currentMeasure, measures, params } = getState();
    if (currentMeasure) {
      const patch: Partial<MeasuresStateModel> = { currentMeasure: undefined };
      if (currentMeasure.sent) {
        patchState(patch);
      } else {
        const measure = { ...currentMeasure, steps: undefined };
        const measureIndex = measures.findIndex(
          historyMeasure => historyMeasure.reportUuid === currentMeasure.reportUuid
        );
        if (measureIndex > -1) {
          patch.measures = [...measures.slice(0, measureIndex), measure, ...measures.slice(measureIndex + 1)];
        } else {
          patch.measures = [...measures, measure];
        }
        patchState(patch);
        if (
          params.autoPublish &&
          measure.accuracy &&
          measure.accuracy < PositionAccuracyThreshold.Inaccurate &&
          measure.endAccuracy &&
          measure.endAccuracy < PositionAccuracyThreshold.Inaccurate
        ) {
          dispatch(new PublishMeasure(measure));
        }
      }
    }
  }

  @Action(CancelMeasure)
  cancelMeasure({ patchState }: StateContext<MeasuresStateModel>) {
    patchState({
      currentMeasure: undefined,
      measureReport: undefined,
      measureSeriesParams: undefined,
      currentSeries: undefined
    });
  }

  @Action(StartMeasureSeriesParams)
  startMeasureSeries({ patchState }: StateContext<MeasuresStateModel>) {
    const model: MeasureSeriesParams = {
      seriesDurationLimit: 1,
      measureHitsLimit: 0,
      measureDurationLimit: 5
    };
    patchState({
      measureSeriesParams: {
        model,
        dirty: false,
        status: '',
        errors: {}
      }
    });
  }

  @Action(StopMeasureSeriesParams)
  stopMeasureSeriesParam({ getState, patchState }: StateContext<MeasuresStateModel>) {
    const { measureSeriesParams } = getState();
    if (measureSeriesParams) {
      patchState({
        measureSeriesParams: undefined,
        currentSeries: new MeasureSeries({
          ...measureSeriesParams.model,
          measureDurationLimit: measureSeriesParams.model.measureDurationLimit
            ? measureSeriesParams.model.measureDurationLimit * 60 * 1000
            : undefined,
          seriesDurationLimit: measureSeriesParams.model.seriesDurationLimit
            ? measureSeriesParams.model.seriesDurationLimit * 60 * 60 * 1000
            : undefined
        })
      });
    }
  }

  @Action(AddMeasureScanStep)
  addMeasureScanStep(
    { getState, patchState, dispatch }: StateContext<MeasuresStateModel>,
    { step, device }: AddMeasureScanStep
  ) {
    const { currentMeasure, currentSeries } = getState();
    if (currentMeasure && currentMeasure.steps) {
      const currentTime = Date.now();
      const newHitsNumber = currentMeasure.hitsNumber + step.hitsNumber;
      if (
        currentSeries &&
        (currentTime - currentMeasure!.startTime > currentSeries.params.measureDurationLimit! ||
          newHitsNumber > currentSeries.params.measureHitsLimit!)
      ) {
        dispatch(new StartNextMeasureSeries());
      } else {
        const measure = {
          ...currentMeasure,
          endTime: step.ts,
          hitsNumber: newHitsNumber,
          steps: [...currentMeasure.steps, step]
        };
        measure.value = this.measuresService.computeRadiationValue(measure, device);
        measure.temperature =
          measure.steps
            .map(currentMeasureStep => currentMeasureStep.temperature)
            .reduce((acc, current) => acc + current) / measure.steps.length;
        patchState({
          currentMeasure: measure
        });
      }
    }
  }

  @Action(UpdateMeasureScanTime)
  updateMeasureScanTime(
    { getState, patchState, dispatch }: StateContext<MeasuresStateModel>,
    { device }: UpdateMeasureScanTime
  ) {
    const { currentMeasure, currentSeries } = getState();
    if (currentMeasure) {
      const currentTime = Date.now();
      if (currentSeries && currentTime - currentMeasure!.startTime > currentSeries.params.measureDurationLimit!) {
        dispatch(new StartNextMeasureSeries());
      } else {
        patchState({
          currentMeasure: {
            ...currentMeasure,
            endTime: currentTime,
            value: this.measuresService.computeRadiationValue(currentMeasure, device)
          }
        });
      }
    }
  }

  @Action(StartMeasureScan)
  startMeasureScan({ getState, patchState }: StateContext<MeasuresStateModel>, { device }: StartMeasureScan) {
    const { currentMeasure, currentPosition, currentSeries } = getState();
    if (currentMeasure) {
      return this.measuresService.startMeasureScan(device).pipe(
        tap(() => {
          const currentTime = Date.now();
          const patch: Partial<MeasuresStateModel> = {
            currentMeasure: {
              ...currentMeasure!,
              startTime: currentTime,
              endTime: currentTime
            }
          };
          if (currentSeries && !currentSeries.startTime && !currentSeries.endTime) {
            patch.currentSeries = {
              ...currentSeries,
              startTime: currentTime,
              endTime: currentTime
            };
          }
          patch.currentMeasure = Measure.updateStartPosition(<Measure>patch.currentMeasure, currentPosition);
          patchState(patch);
        })
      );
    } else {
      return of();
    }
  }

  @Action(StopMeasureScan)
  stopMeasureScan({ getState, patchState }: StateContext<MeasuresStateModel>) {
    const { currentMeasure, currentPosition, currentSeries } = getState();
    if (currentMeasure) {
      let patch: Partial<MeasuresStateModel>;
      const updatedMeasure = Measure.updateEndPosition(currentMeasure, currentPosition);
      if (currentSeries) {
        patch = { currentMeasure: undefined };
        if (updatedMeasure.hitsNumber >= HitsAccuracyThreshold.Accurate) {
          patch.currentSeries = MeasureSeries.addMeasureToSeries(currentSeries, updatedMeasure);
        }
      } else {
        patch = { currentMeasure: updatedMeasure };
      }
      patchState(patch);
    }
  }

  @Action(StartNextMeasureSeries)
  startNextMeasureSeriesScan({ getState, patchState, dispatch }: StateContext<MeasuresStateModel>) {
    const { currentMeasure, currentPosition, currentSeries } = getState();
    if (currentMeasure && currentSeries) {
      if (currentMeasure.endTime! - currentSeries.startTime! < currentSeries.params.seriesDurationLimit!) {
        dispatch(new StopMeasureScan());
      } else {
        const updatedMeasure = Measure.updateEndPosition(currentMeasure, currentPosition);
        const newMeasure = Measure.updateStartPosition(
          new Measure(
            currentMeasure.apparatusId,
            currentMeasure.apparatusVersion,
            currentMeasure.apparatusSensorType,
            currentMeasure.apparatusTubeType,
            this.device.uuid,
            this.device.platform,
            this.device.version,
            this.device.model
          ),
          currentPosition
        );
        patchState({
          currentMeasure: newMeasure,
          currentSeries: MeasureSeries.addMeasureToSeries(currentSeries, updatedMeasure)
        });
      }
    }
  }

  @Action(StartMeasureReport)
  startMeasureReport({ getState, patchState }: StateContext<MeasuresStateModel>) {
    const { currentMeasure } = getState();
    if (currentMeasure) {
      const model: MeasureReport = {
        latitude: currentMeasure.latitude ? Number(currentMeasure.latitude.toFixed(7)) : undefined,
        longitude: currentMeasure.longitude ? Number(currentMeasure.longitude.toFixed(7)) : undefined,
        endLatitude: currentMeasure.endLatitude ? Number(currentMeasure.endLatitude.toFixed(7)) : undefined,
        endLongitude: currentMeasure.endLongitude ? Number(currentMeasure.endLongitude.toFixed(7)) : undefined,
        date: this.dateService.toISOString(currentMeasure.startTime),
        startTime: this.dateService.toISOString(currentMeasure.startTime),
        duration: currentMeasure.endTime
          ? this.dateService.toISODuration(currentMeasure.endTime - currentMeasure.startTime)
          : undefined,
        temperature:
          currentMeasure.temperature !== undefined ? Number(currentMeasure.temperature!.toFixed(2)) : undefined,
        hitsNumber: currentMeasure.hitsNumber !== undefined ? currentMeasure.hitsNumber : undefined,
        value: currentMeasure.value !== undefined ? Number(currentMeasure.value.toFixed(3)) : undefined,
        measurementHeight:
          currentMeasure.measurementHeight !== undefined ? currentMeasure.measurementHeight : undefined,
        description: currentMeasure.description !== undefined ? currentMeasure.description : undefined,
        tags: currentMeasure.tags ? currentMeasure.tags : undefined,
        measurementEnvironment: currentMeasure.measurementEnvironment
          ? currentMeasure.measurementEnvironment
          : undefined,
        rain: currentMeasure.rain !== undefined ? currentMeasure.rain : undefined,
        enclosedObject: currentMeasure.enclosedObject !== undefined ? currentMeasure.enclosedObject : undefined
      };
      patchState({
        measureReport: {
          model,
          dirty: false,
          status: '',
          errors: {}
        }
      });
    }
  }

  @Action(StopMeasureReport)
  stopMeasureReport({ getState, patchState }: StateContext<MeasuresStateModel>) {
    const { currentMeasure, measureReport } = getState();
    if (currentMeasure && measureReport) {
      let currentMeasure_: Measure = {
        ...currentMeasure,
        measurementHeight: measureReport.model.measurementHeight!,
        measurementEnvironment: measureReport.model.measurementEnvironment!,
        rain: measureReport.model.rain!,
        description: measureReport.model.description,
        tags: measureReport.model.tags,
        enclosedObject: measureReport.model.enclosedObject
      };
      if (currentMeasure.manualReporting) {
        const durationDate = new Date(measureReport.model.duration!);
        currentMeasure_ = {
          ...currentMeasure_,
          temperature: measureReport.model.temperature!,
          value: measureReport.model.value!,
          hitsNumber: measureReport.model.hitsNumber!,
          endTime:
            currentMeasure.startTime +
            (durationDate.getHours() * 60 * 60 + durationDate.getMinutes() * 60 + durationDate.getSeconds()) * 1000,
          measurementHeight: measureReport.model.measurementHeight!,
          measurementEnvironment: measureReport.model.measurementEnvironment!,
          rain: measureReport.model.rain!
        };
      }
      patchState({
        measureReport: undefined,
        currentMeasure: currentMeasure_
      });
    }
  }

  @Action(PublishMeasure)
  publishMeasure({ getState, patchState }: StateContext<MeasuresStateModel>, { measure }: PublishMeasure) {
    if (!measure.sent) {
      const { measures } = getState();
      const index = measures.findIndex(stateMeasure => stateMeasure.reportUuid === measure.reportUuid);
      if (index !== -1) {
        return this.measuresService.publishMeasure(measure).pipe(
          tap(() => {
            const measures_ = [...measures];
            measures_.splice(index, 1);
            patchState({
              measures: [...measures.slice(0, index), { ...measure, sent: true }, ...measures.slice(index + 1)]
            });
          })
        );
      }
    }
    return of();
  }

  @Action(DeleteMeasure)
  deleteMeasure({ getState, patchState }: StateContext<MeasuresStateModel>, { measure }: DeleteMeasure) {
    if (!measure.sent) {
      const { measures } = getState();
      const index = measures.findIndex(stateMeasure => stateMeasure.reportUuid === measure.reportUuid);
      if (index !== -1) {
        patchState({
          measures: [...measures.slice(0, index), ...measures.slice(index + 1)]
        });
      }
    }
  }

  @Action(DeleteAllMeasures)
  deleteAllMeasures({ patchState }: StateContext<MeasuresStateModel>) {
    patchState({
      measures: []
    });
  }

  @Action(ShowMeasure)
  showMeasure({ patchState }: StateContext<MeasuresStateModel>, { measure }: PublishMeasure) {
    patchState({
      currentMeasure: { ...measure }
    });
  }
}
