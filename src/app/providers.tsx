import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { AuthBootstrap } from "@/features/auth/AuthBootstrap";
import { store } from "./store";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </Provider>
  );
}
