import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
  ZoomableGroup
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// A representative list of 92+ countries (ISO codes)
const highlightedCountries = [
  "USA", "CAN", "MEX", "BRA", "ARG", "CHL", "COL", "PER", "GBR", "FRA", 
  "DEU", "ITA", "ESP", "NLD", "BEL", "CHE", "AUT", "SWE", "NOR", "FIN", 
  "DNK", "POL", "CZE", "HUN", "ROU", "GRC", "PRT", "IRL", "TUR", "RUS", 
  "UZB", "KAZ", "AZE", "GEO", "ARM", "ISR", "SAU", "ARE", "QAT", "KWT", 
  "OMN", "BHR", "EGY", "MAR", "ZAF", "NGA", "KEN", "ETH", "GHA", "SEN", 
  "IND", "PAK", "BGD", "LKA", "SGP", "MYS", "THA", "IDN", "VNM", "PHL", 
  "CHN", "JPN", "KOR", "AUS", "NZL", "UKR", "BLR", "LTU", "LVA", "EST", 
  "SVK", "SVN", "HRV", "SRB", "BGR", "ALB", "MKD", "MNE", "BIH", "CYP", 
  "MLT", "LBN", "JOR", "IRQ", "KWT", "TUN", "DZA", "LBY", "GAB", "CIV", 
  "CMR", "UGA", "RWA", "TZA", "ZMB", "NAM", "BWA", "MUS"
];

const WorldMap = ({ variant = "default" }: { variant?: "default" | "red" }) => {
  const [tooltipContent, setTooltipContent] = useState("");

  const colors = variant === "red" ? {
    highlight: "#b91c1c", // Deep red
    base: "#ffffff",      // White for non-highlighted
    bg: "#000000",       // Black background
    stroke: "#000000",
    text: "#ffffff"
  } : {
    highlight: "#2DD4BF",
    base: "#1e293b",
    bg: "transparent",
    stroke: "#0A1120",
    text: "#2DD4BF"
  };

  return (
    <div className={`w-full rounded-3xl border border-white/5 p-4 relative overflow-hidden group ${variant === 'red' ? 'bg-black' : 'bg-brand-dark/20'}`}>
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-xl font-bold text-white mb-1">Global Presence</h3>
        <p className={`text-xs font-bold uppercase tracking-widest ${variant === 'red' ? 'text-red-500' : 'text-brand-teal'}`}>92+ Countries Served</p>
      </div>

      <div className="w-full aspect-[2/1] min-h-[400px]">
        <ComposableMap
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: 147
          }}
        >
          <ZoomableGroup zoom={1}>
            <Sphere stroke="#ffffff10" strokeWidth={0.5} id="sphere" fill="transparent" />
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isHighlighted = highlightedCountries.includes(geo.id) || highlightedCountries.includes(geo.properties.name) || highlightedCountries.includes(geo.properties.iso_a3);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        setTooltipContent(geo.properties.name);
                      }}
                      onMouseLeave={() => {
                        setTooltipContent("");
                      }}
                      style={{
                        default: {
                          fill: isHighlighted ? colors.highlight : colors.base,
                          outline: "none",
                          stroke: colors.stroke,
                          strokeWidth: 0.5,
                          transition: "all 250ms"
                        },
                        hover: {
                          fill: isHighlighted ? (variant === 'red' ? "#ef4444" : "#5eead4") : (variant === 'red' ? "#f3f4f6" : "#334155"),
                          outline: "none",
                          stroke: colors.stroke,
                          strokeWidth: 0.5,
                          cursor: "pointer"
                        },
                        pressed: {
                          fill: colors.highlight,
                          outline: "none"
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <AnimatePresence>
        {tooltipContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute bottom-6 right-6 px-4 py-2 rounded-xl font-bold text-xs shadow-2xl pointer-events-none ${variant === 'red' ? 'bg-red-600 text-white' : 'bg-brand-teal text-brand-dark'}`}
          >
            {tooltipContent}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full shadow-lg ${variant === 'red' ? 'bg-red-600 shadow-red-600/50' : 'bg-brand-teal shadow-brand-teal/50'}`} />
          <span className="text-[10px] text-white/60 font-medium">Active Coverage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${variant === 'red' ? 'bg-white' : 'bg-slate-800'}`} />
          <span className="text-[10px] text-white/60 font-medium">Expansion Pending</span>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
