import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Loading from "./components/Loading";

const DependencyGraph = lazy(() => import("./pages/DependencyGraph"));
const Diff = lazy(() => import("./pages/Diff"));
const Metrics = lazy(() => import("./pages/Metrics"));
const Insights = lazy(() => import("./pages/Insights"));
const Endpoints = lazy(() => import("./pages/Endpoints"));
const Interfaces = lazy(() => import("./pages/Interfaces"));
const Swagger = lazy(() => import("./pages/Swagger"));

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Header />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<DependencyGraph />} />
          <Route path="/Diff" element={<Diff />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/endpoints" element={<Endpoints />} />
          <Route path="/interfaces" element={<Interfaces />} />
          <Route path="/swagger/:service" element={<Swagger />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
