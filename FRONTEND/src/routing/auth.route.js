import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./routeTree.js";
import AuthPage from "../components/AuthPage.jsx";

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: AuthPage,
});
