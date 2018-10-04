export interface MeasureApi {
  apiKey: string;
  data: {
    apparatusId?: string;
    apparatusVersion?: string;
    apparatusSensorType?: ApparatusSensorType;
    apparatusTubeType?: string;
    temperature?: number;
    value: number;
    hitsNumber?: number;
    startTime: string;
    endTime?: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    altitudeAccuracy?: number;
    endLatitude?: number;
    endLongitude?: number;
    endAccuracy?: number;
    endAltitude?: number;
    endAltitudeAccuracy?: number;
    deviceUuid?: string;
    devicePlatform?: string;
    deviceVersion?: string;
    deviceModel?: string;
    reportUuid: string;
    manualReporting?: boolean;
    organisationReporting?: string;
    reportContext: string;
    description?: string;
    measurementHeight?: number;
    tags?: string[];
    userId?: string;
    userPwd?: string;
    measurementEnvironment?: string;
    rain?: boolean;
    enclosedObject?: string;
  };
}

export enum ApparatusSensorType {
  Geiger = 'geiger',
  Photodiode = 'photodiode'
}
