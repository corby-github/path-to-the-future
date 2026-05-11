import { useContext } from 'react';
import { DevControlsContext, type DevControls } from './DevControlsContext';

export function useDevControls(): DevControls {
  return useContext(DevControlsContext);
}
