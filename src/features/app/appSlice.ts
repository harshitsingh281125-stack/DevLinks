import { createSlice } from "@reduxjs/toolkit";

type AppState = {
  sidebarOpen: boolean;
};

const initialState: AppState = {
  sidebarOpen: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
  },
});

export const { closeSidebar, toggleSidebar } = appSlice.actions;
export const appReducer = appSlice.reducer;
