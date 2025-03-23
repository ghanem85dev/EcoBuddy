// CoordinateContext.js
import React, { createContext, useState } from 'react';

export const CoordinateContext = createContext();

export const CoordinateProvider = ({ children }) => {
  const [coordinates, setCoordinates] = useState(null);

  return (
    <CoordinateContext.Provider value={{ coordinates, setCoordinates }}>
      {children}
    </CoordinateContext.Provider>
  );
};