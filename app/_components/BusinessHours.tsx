"use client";

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
      <h3 className="mb-6 text-center font-semibold text-gray-800 text-xl">
        営業時間
      </h3>
      <div className="neumorphism-raised overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-amber-300/50 border-b bg-amber-100/50">
              <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider" />
              {days.map((day) => (
                <th
                  key={day}
                  className="px-6 py-3 text-center font-medium text-gray-500 text-lg tracking-wider"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="transition-colors duration-150 hover:bg-amber-200/50 hover:bg-opacity-30">
              <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-800 text-sm">
                午前
                <br />
                <span className="text-gray-600 text-xs">10:00～13:00</span>
              </td>
              {days.map((day, index) => (
                <td
                  key={`${day}-morning`}
                  className="whitespace-nowrap px-6 py-4 text-center"
                >
                  <span className="font-medium text-gray-600 text-lg">
                    {getStatus(index, "morning")}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="transition-colors duration-150 hover:bg-amber-200/50 hover:bg-opacity-30">
              <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-800 text-sm">
                午後
                <br />
                <span className="text-gray-600 text-xs">15:00～19:00</span>
              </td>
              {days.map((day, index) => (
                <td
                  key={`${day}-afternoon`}
                  className="whitespace-nowrap px-6 py-4 text-center"
                >
                  <span className="font-medium text-gray-600 text-lg">
                    {getStatus(index, "afternoon")}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-center text-gray-600 text-sm">
        休業日：水曜・日曜・祝日
      </p>
    </div>
  );
}
