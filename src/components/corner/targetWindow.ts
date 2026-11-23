import { createContext, useContext } from 'react';

/** The window a subtree renders into (main window or the PiP window); timers should use it. */
export const TargetWindowContext = createContext<Window>(window);
export const useTargetWindow = () => useContext(TargetWindowContext);
