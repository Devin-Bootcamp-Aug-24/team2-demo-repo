import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212e",
        mist: "#f5f7fa",
        navy: "#0b1f3a",
        cyan: "#12b8b0",
        amber: "#f4b740",
        coral: "#e8795e"
      },
      boxShadow: {
        card: "0 12px 34px rgba(23, 33, 46, 0.07)"
      }
    }
  },
  plugins: []
};

export default config;
