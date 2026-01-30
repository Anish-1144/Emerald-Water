import { create } from 'zustand';

interface DesignStore {
  capColor: string;
  labelTexture: string | null;
  setCapColor: (color: string) => void;
  setLabelTexture: (texture: string | null) => void;
}

export const useDesignStore = create<DesignStore>((set) => ({
  capColor: '#ffffff',
  labelTexture: null,
  setCapColor: (color) => set({ capColor: color }),
  setLabelTexture: (texture) => set({ labelTexture: texture }),
}));

