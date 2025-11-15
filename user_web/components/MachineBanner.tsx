import { useRouter } from "next/router";
import { useState } from "react";

interface MachineBannerProps {
  machineId: string;
  location?: string;
  showChangeButton?: boolean;
  variant?: "default" | "compact";
}

export default function MachineBanner({
  machineId,
  location,
  showChangeButton = true,
  variant = "default",
}: MachineBannerProps) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  const handleChangeMachine = () => {
    setIsChanging(true);
    // Redirect to order page for machine selection
    router.push("/order");
  };

  if (variant === "compact") {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              {machineId}
              {location && <span className="text-blue-600 ml-1">• {location}</span>}
            </span>
          </div>

          {showChangeButton && (
            <button
              onClick={handleChangeMachine}
              disabled={isChanging}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
            >
              {isChanging ? "Changing..." : "Change"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-4 shadow-md">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-xs opacity-90">Ordering at</div>
              <div className="font-semibold text-lg">{machineId}</div>
              {location && <div className="text-sm opacity-90">{location}</div>}
            </div>
          </div>

          {showChangeButton && (
            <button
              onClick={handleChangeMachine}
              disabled={isChanging}
              className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {isChanging ? "Changing..." : "Change Machine"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
