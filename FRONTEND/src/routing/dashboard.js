import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./routeTree.js";
import AuthPage from "../components/AuthPage.jsx";
import Dashboard from "../components/Dashboard.jsx";

export const dashBoardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});
