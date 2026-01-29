
export interface WasteAnalysis {
  mainMaterial: string;
  confidences: {
    glass: number;
    plastic: number;
    paper: number;
    cardboard: number;
    other: number;
  };
  recyclingTip: string;
  isRecyclable: boolean;
}

export type AppState = 'idle' | 'capturing' | 'analyzing' | 'result' | 'error';
