
import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { Select, MenuItem } from "@mui/material";

export const ThemeSelector = () => {
  const { theme, setTheme } = useEditorStore();
  const themes = ["vs", "vs-dark", "hc-black", "hc-light"];

  function applyTheme(theme: string) {
    setTheme(theme);
    localStorage.setItem("editorTheme", theme);
    
  }
  useEffect(() => {
    const savedTheme = localStorage.getItem("editorTheme");
    if (savedTheme && themes.includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

    return (
    <Select

      style={{ position: "fixed", bottom: 30, right: 20, zIndex: 1000, background: "white" }}
      value={theme}
      onChange={(event) => applyTheme(event.target.value as string)}
    >
      {themes.map((theme) => (
        <MenuItem key={theme} value={theme}>
          {theme}
        </MenuItem>
      ))}
    </Select>
  );
};
