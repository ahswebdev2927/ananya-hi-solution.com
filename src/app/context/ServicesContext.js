"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context
const ServicesContext = createContext({
  services: [],
  isLoading: true,
  error: null,
});

// Fallback services in case the API fails or is slow, ensuring fast paints
const fallbackServices = [
  { id: "web-design", title: "Website Design", iconName: "globe" },
  { id: "digital-marketing", title: "Digital Marketing", iconName: "trending-up" },
  { id: "mobile-app", title: "Mobile Application", iconName: "smartphone" },
  { id: "ecommerce-app", title: "eCommerce Application", iconName: "shopping-cart" },
  { id: "video-production", title: "Video Production", iconName: "video" },
  { id: "software-development", title: "Software Development", iconName: "code" },
];

export function ServicesProvider({ children }) {
  const [services, setServices] = useState(fallbackServices);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/services");
        if (res.ok) {
          const data = await res.json();
          // Overwrite the fallback with live DB data (which includes new services)
          setServices(data);
        } else {
          throw new Error("Failed to fetch services");
        }
      } catch (err) {
        console.error("ServicesContext error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []); // Empty dependency array ensures this only runs ONCE on app mount

  return (
    <ServicesContext.Provider value={{ services, isLoading, error }}>
      {children}
    </ServicesContext.Provider>
  );
}

// Custom hook to easily consume the services context
export function useServices() {
  return useContext(ServicesContext);
}
