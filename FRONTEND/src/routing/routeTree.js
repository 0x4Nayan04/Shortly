import { createRootRoute, createRoute } from "@tanstack/react-router";
import RootLayout from "../RootLayout";
import HomePage from "../pages/HomePage.jsx";
import AuthPage from "../components/AuthPage.jsx";
import Dashboard from "../components/Dashboard.jsx";

export const rootRoute = createRootRoute({
  component: RootLayout,
});

export const homePageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: AuthPage,
});

export const dashBoardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

export const routeTree = rootRoute.addChildren([
  homePageRoute,
  dashBoardRoute,
  authRoute,
]);
