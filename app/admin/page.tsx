export default async function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="mb-8 font-bold text-3xl text-gray-900">
          管理者ダッシュボード
        </h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 font-semibold text-xl">管理者専用機能</h2>
          <p className="text-gray-600">
            管理者としてログインしています。ここから各種管理機能にアクセスできます。
          </p>
        </div>
      </div>
    </div>
  );
}
