import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  pdfLoading: false,
};

export const loadingSlice = createSlice({
  name: "loadingSlice",
  initialState,
  reducers: {
    setLoading: (state, actions) => {
      state.loading = actions.payload;
    },
    setPDFLoading: (state, actions) => {
      state.pdfLoading = actions.payload;
    }
  },
});
export const { setLoading, setPDFLoading } = loadingSlice.actions;
export default loadingSlice.reducer;
