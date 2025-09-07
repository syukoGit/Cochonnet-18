import { configureStore } from '@reduxjs/toolkit';
import eventReducer from './eventSlice';

const store = configureStore({
  reducer: {
    event: eventReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore persistence actions in serializable check
        ignoredActions: ['persistence/requestManualSave'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { store };
