export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full absolute border-4 border-gray-200"></div>
        <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-blue-500 border-t-transparent"></div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Ejecutando simulación...
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Esto puede tomar unos momentos
        </p>
      </div>
    </div>
  );
}
