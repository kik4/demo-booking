interface BusinessHoursProps {
  className?: string;
}

export function BusinessHours({ className = "" }: BusinessHoursProps) {
  const days = ["月", "火", "水", "木", "金", "土", "日"];

  const getStatus = (dayIndex: number, period: "morning" | "afternoon") => {
    if (dayIndex === 2 || dayIndex === 6) return "／";
    if (dayIndex === 5 && period === "afternoon") return "／";
    return "〇";
  };

  return (
    <div className={className}>
      <h3 className="mb-4 text-center font-semibold text-gray-800 text-lg sm:mb-6 sm:text-xl">
        営業時間
      </h3>
      <div className="neumorphism-raised overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-amber-100/50">
              <th className="px-2 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider sm:px-6 sm:py-3" />
              {days.map((day) => (
                <th
                  key={day}
                  className="px-1 py-2 text-center font-medium text-gray-500 text-sm tracking-wider sm:px-6 sm:py-3 sm:text-lg"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="transition-colors duration-150 hover:bg-amber-200/50 hover:bg-opacity-30">
              <td className="whitespace-nowrap py-3 font-medium text-gray-800 text-xs sm:px-6 sm:py-4 sm:text-sm">
                <div className="text-center">
                  9:00
                  <br />
                  <span className="text-gray-400 text-xs">▼</span>
                  <br />
                  13:00
                </div>
              </td>
              {days.map((day, index) => (
                <td
                  key={`${day}-morning`}
                  className="whitespace-nowrap px-1 py-3 text-center sm:px-6 sm:py-4"
                >
                  <span className="font-medium text-amber-600 text-sm sm:text-lg">
                    {getStatus(index, "morning")}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="transition-colors duration-150 hover:bg-amber-200/50 hover:bg-opacity-30">
              <td className="whitespace-nowrap py-3 font-medium text-gray-800 text-xs sm:px-6 sm:py-4 sm:text-sm">
                <div className="text-center">
                  15:00
                  <br />
                  <span className="text-gray-400 text-xs">▼</span>
                  <br />
                  19:00
                </div>
              </td>
              {days.map((day, index) => (
                <td
                  key={`${day}-afternoon`}
                  className="whitespace-nowrap px-1 py-3 text-center sm:px-6 sm:py-4"
                >
                  <span className="font-medium text-amber-600 text-sm sm:text-lg">
                    {getStatus(index, "afternoon")}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-amber-100/50" colSpan={8}>
                <p className="py-2 text-center text-gray-600 text-xs sm:text-sm">
                  休業日：水曜・日曜・祝日
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
