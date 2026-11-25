import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: null
};

const BreadcrumbSlice = createSlice({
  name: "BreadcrumbSlice",
  initialState,
  reducers: {
    setBreadcrumbValue: (state, action) => {
      state.value = action.payload;
    }
  }
});

export const { setBreadcrumbValue } = BreadcrumbSlice.actions;
export default BreadcrumbSlice.reducer;