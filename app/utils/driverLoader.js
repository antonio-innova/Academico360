"use client";

let driverLoadingPromise = null;

const getDriverFunction = () => {
  if (typeof window === "undefined") return null;

  const fromCdn = window?.driver?.js?.driver;
  if (typeof fromCdn === "function") return fromCdn;

  if (typeof window?.driver === "function") return window.driver;
  if (typeof window?.Driver === "function") return window.Driver;

  return null;
};

export const loadDriver = async () => {
  if (typeof window === "undefined") return null;

  const existing = getDriverFunction();
  if (existing) return existing;

  if (!driverLoadingPromise) {
    driverLoadingPromise = new Promise((resolve, reject) => {
      const finish = () => resolve();

      if (!document.getElementById("driverjs-css")) {
        const link = document.createElement("link");
        link.id = "driverjs-css";
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("driverjs-script")) {
        const script = document.createElement("script");
        script.id = "driverjs-script";
        script.src = "https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.js.iife.js";
        script.onload = finish;
        script.onerror = () => {
          driverLoadingPromise = null;
          reject(new Error("No se pudo cargar Driver.js"));
        };
        document.body.appendChild(script);
      } else {
        finish();
      }
    });
  }

  try {
    await driverLoadingPromise;
  } catch (error) {
    console.error("Error al cargar Driver.js", error);
    return null;
  }

  return getDriverFunction();
};

