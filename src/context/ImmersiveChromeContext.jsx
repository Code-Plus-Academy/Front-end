import { createContext, useContext, useState } from 'react';

const ImmersiveChromeContext = createContext({
  chromeVisible: true,
  setChromeVisible: () => {},
});

export function ImmersiveChromeProvider({ children }) {
  const [chromeVisible, setChromeVisible] = useState(true);

  return (
    <ImmersiveChromeContext.Provider value={{ chromeVisible, setChromeVisible }}>
      {children}
    </ImmersiveChromeContext.Provider>
  );
}

export function useImmersiveChrome() {
  return useContext(ImmersiveChromeContext);
}
