import { useContext } from "react";
import { ThemeProviderContext } from "../context/ThemeContext"; // Correction de l'import relatif

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};